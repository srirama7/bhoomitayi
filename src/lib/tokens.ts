import { db } from "@/lib/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc,
  increment,
} from "firebase/firestore";
import type { Profile, Coupon, TokenRequest, BoosterRequest } from "@/lib/types/database";
import { DEFAULT_FREE_TOKENS, TOKEN_UNLOCK_COST } from "@/lib/constants";
import { cleanFirestoreData } from "@/lib/utils";

export async function unlockListingWithToken(
  userId: string,
  listingId: string
): Promise<{ success: boolean; error?: string; remainingTokens?: number }> {
  if (!db || !userId || !listingId) {
    return { success: false, error: "Database or user not found" };
  }

  try {
    const profileRef = doc(db, "profiles", userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      return { success: false, error: "User profile not found" };
    }

    const data = profileSnap.data() as Profile;
    const currentTokens = data.tokens ?? DEFAULT_FREE_TOKENS;
    const unlocked = data.unlocked_listings || [];

    if (unlocked.includes(listingId)) {
      return { success: true, remainingTokens: currentTokens };
    }

    if (currentTokens < TOKEN_UNLOCK_COST) {
      return {
        success: false,
        error: `Insufficient BhoomiTayi tokens. You need ${TOKEN_UNLOCK_COST} tokens to view contact details (you have ${currentTokens} tokens). Please buy more tokens.`
      };
    }

    const newTokens = currentTokens - TOKEN_UNLOCK_COST;
    const newUnlocked = [...unlocked, listingId];

    await updateDoc(profileRef, {
      tokens: newTokens,
      unlocked_listings: newUnlocked,
      updated_at: new Date().toISOString(),
    });

    return { success: true, remainingTokens: newTokens };
  } catch (error) {
    console.error("Error unlocking listing with token:", error);
    return { success: false, error: "Failed to unlock listing. Please try again." };
  }
}

export async function submitTokenPurchaseRequest(params: {
  userId: string;
  userName: string;
  userEmail?: string | null;
  userPhone?: string | null;
  tokens: number;
  amount: number;
  transactionId?: string | null;
  paymentProof?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    const timestamp = new Date().toISOString();
    const tokenReqsRef = collection(db, "token_requests");

    const newDoc = await addDoc(tokenReqsRef, cleanFirestoreData({
      user_id: params.userId,
      user_name: params.userName || "User",
      user_email: params.userEmail || "",
      user_phone: params.userPhone || "",
      tokens: params.tokens,
      amount: params.amount,
      transaction_id: params.transactionId?.trim() || "",
      payment_proof: params.paymentProof || "",
      notes: params.notes || "",
      status: "pending",
      created_at: timestamp,
      updated_at: timestamp,
    }));

    return { success: true, id: newDoc.id };
  } catch (error) {
    console.error("Error submitting token request:", error);
    return { success: false, error: String(error) };
  }
}

export async function approveTokenPurchase(
  requestId: string,
  userId: string,
  tokensToAdd: number
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const reqRef = doc(db, "token_requests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      return { success: false, error: "Token request not found" };
    }

    const reqData = reqSnap.data() as TokenRequest;
    const effectiveUserId = userId || reqData.user_id;
    const userEmail = reqData.user_email?.trim() || "";

    let targetProfileId: string | null = null;
    let currentTokens = DEFAULT_FREE_TOKENS;

    // 1. Check if profile doc exists by effectiveUserId
    if (effectiveUserId) {
      const profileRef = doc(db, "profiles", effectiveUserId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        targetProfileId = profileSnap.id;
        currentTokens = (profileSnap.data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
      }
    }

    // 2. Fallback: Search profiles by userEmail if profile was not found by ID
    if (!targetProfileId && userEmail) {
      const q = query(
        collection(db, "profiles"),
        where("email", "==", userEmail.toLowerCase())
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetProfileId = snap.docs[0].id;
        currentTokens = (snap.docs[0].data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
      } else {
        const qExact = query(
          collection(db, "profiles"),
          where("email", "==", userEmail)
        );
        const snapExact = await getDocs(qExact);
        if (!snapExact.empty) {
          targetProfileId = snapExact.docs[0].id;
          currentTokens = (snapExact.docs[0].data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
        }
      }
    }

    // 3. If profile still doesn't exist, targetProfileId is effectiveUserId
    if (!targetProfileId) {
      targetProfileId = effectiveUserId || doc(collection(db, "profiles")).id;
    }

    const newTokens = currentTokens + (tokensToAdd || 0);

    // Save/update profile with merge: true
    await setDoc(
      doc(db, "profiles", targetProfileId),
      {
        id: targetProfileId,
        email: userEmail || null,
        full_name: reqData.user_name || "Customer",
        tokens: newTokens,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    // Update token request status
    await updateDoc(reqRef, {
      status: "approved",
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving token request:", error);
    return { success: false, error: String(error) || "Failed to approve request" };
  }
}

export async function rejectTokenPurchase(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const reqRef = doc(db, "token_requests", requestId);
    await updateDoc(reqRef, {
      status: "rejected",
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error rejecting token request:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

export async function approveBoosterRequest(
  requestId: string,
  collectionName: "booster_requests" | "token_requests" = "booster_requests",
  listingId?: string | null,
  planDays?: number | null
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const reqRef = doc(db, collectionName, requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      return { success: false, error: "Booster request not found" };
    }

    const data = reqSnap.data();
    let targetListingId = listingId || data.listing_id;

    if (!targetListingId && data.notes) {
      const match = data.notes.match(/Listing ID:\s*([A-Za-z0-9_-]+)/i);
      if (match) {
        targetListingId = match[1];
      }
    }

    let daysToGrant = planDays || data.plan_days || 30;
    if (!daysToGrant && data.notes) {
      const daysMatch = data.notes.match(/\((\d+)\s*Days?\)/i);
      if (daysMatch) {
        daysToGrant = parseInt(daysMatch[1], 10);
      }
    }

    if (targetListingId) {
      const listingRef = doc(db, "listings", targetListingId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const expiresAt = new Date(Date.now() + (daysToGrant || 30) * 24 * 60 * 60 * 1000).toISOString();
        const isPin = data.notes?.toLowerCase().includes("pin") || data.plan_name?.toLowerCase().includes("pin");

        const updateData: Record<string, any> = {
          status: "active",
          payment_status: "approved",
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        };

        if (isPin) {
          updateData.pinned = true;
          updateData.pin_status = "approved";
          updateData.pin_expires_at = expiresAt;
        }

        await updateDoc(listingRef, updateData);
      }
    }

    await updateDoc(reqRef, {
      status: "approved",
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving booster request:", error);
    return { success: false, error: String(error) || "Failed to approve booster request" };
  }
}

export async function rejectBoosterRequest(
  requestId: string,
  collectionName: "booster_requests" | "token_requests" = "booster_requests"
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const reqRef = doc(db, collectionName, requestId);
    await updateDoc(reqRef, {
      status: "rejected",
      updated_at: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error rejecting booster request:", error);
    return { success: false, error: "Failed to reject request" };
  }
}

export async function adminGrantUserTokens(
  userId: string,
  tokenCount: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const profileRef = doc(db, "profiles", userId);
    const snap = await getDoc(profileRef);
    if (!snap.exists()) {
      return { success: false, error: "User not found" };
    }

    const current = (snap.data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
    const newTotal = Math.max(0, current + tokenCount);

    await updateDoc(profileRef, {
      tokens: newTotal,
      updated_at: new Date().toISOString(),
    });

    return { success: true, newTotal };
  } catch (error) {
    console.error("Error granting tokens:", error);
    return { success: false, error: "Failed to grant tokens" };
  }
}

export async function adminSetUserTokens(
  userId: string,
  tokenCount: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };

  try {
    const profileRef = doc(db, "profiles", userId);
    await updateDoc(profileRef, {
      tokens: Math.max(0, tokenCount),
      updated_at: new Date().toISOString(),
    });

    return { success: true, newTotal: Math.max(0, tokenCount) };
  } catch (error) {
    console.error("Error setting tokens:", error);
    return { success: false, error: "Failed to update tokens" };
  }
}

export async function adminGrantTokensByEmail(
  email: string,
  tokenCount: number
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  if (!db || !email) return { success: false, error: "Invalid email" };

  try {
    const q = query(
      collection(db, "profiles"),
      where("email", "==", email.trim().toLowerCase())
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // Try searching exact email without lowercase if not found
      const qExact = query(
        collection(db, "profiles"),
        where("email", "==", email.trim())
      );
      const snapExact = await getDocs(qExact);
      if (snapExact.empty) {
        return { success: false, error: `No user found with email ${email}` };
      }
      const userDoc = snapExact.docs[0];
      const current = (userDoc.data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
      const newTotal = Math.max(0, current + tokenCount);
      await updateDoc(doc(db, "profiles", userDoc.id), {
        tokens: newTotal,
        updated_at: new Date().toISOString(),
      });
      return { success: true, user: { id: userDoc.id, ...userDoc.data(), tokens: newTotal } as Profile };
    }

    const userDoc = snap.docs[0];
    const current = (userDoc.data() as Profile).tokens ?? DEFAULT_FREE_TOKENS;
    const newTotal = Math.max(0, current + tokenCount);
    await updateDoc(doc(db, "profiles", userDoc.id), {
      tokens: newTotal,
      updated_at: new Date().toISOString(),
    });

    return { success: true, user: { id: userDoc.id, ...userDoc.data(), tokens: newTotal } as Profile };
  } catch (error) {
    console.error("Error granting tokens by email:", error);
    return { success: false, error: "Failed to grant tokens by email" };
  }
}

export async function validateCouponCode(
  code: string,
  applicableTo: "tokens" | "listings" | "all" = "all",
  originalAmount: number
): Promise<{
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}> {
  if (!db || !code?.trim()) {
    return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "Please enter a coupon code." };
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    const q = query(
      collection(db, "coupons"),
      where("code", "==", cleanCode)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "Invalid coupon code." };
    }

    const docSnap = snap.docs[0];
    const coupon = { id: docSnap.id, ...docSnap.data() } as Coupon;

    if (!coupon.is_active) {
      return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "This coupon is no longer active." };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "This coupon has expired." };
    }

    if (coupon.max_uses && (coupon.usage_count || 0) >= coupon.max_uses) {
      return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "This coupon has reached its maximum usage limit." };
    }

    if (coupon.applicable_to !== "all" && applicableTo !== "all" && coupon.applicable_to !== applicableTo) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: originalAmount,
        message: `This coupon is only valid for ${coupon.applicable_to === "tokens" ? "token purchases" : "listing fees"}.`
      };
    }

    if (coupon.min_order_value && originalAmount < coupon.min_order_value) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: originalAmount,
        message: `Minimum order amount of ₹${coupon.min_order_value} required to apply this coupon.`
      };
    }

    let discount = 0;
    if (coupon.discount_type === "percentage") {
      discount = Math.round((originalAmount * coupon.discount_value) / 100);
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount);
      }
    } else {
      discount = coupon.discount_value;
    }

    discount = Math.min(discount, originalAmount);
    const finalAmount = Math.max(0, originalAmount - discount);

    return {
      valid: true,
      coupon,
      discountAmount: discount,
      finalAmount,
      message: `Coupon "${cleanCode}" applied successfully! You save ₹${discount}.`
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, discountAmount: 0, finalAmount: originalAmount, message: "Error verifying coupon code." };
  }
}

export async function recordCouponUsage(couponId: string): Promise<void> {
  if (!db || !couponId) return;
  try {
    const couponRef = doc(db, "coupons", couponId);
    await updateDoc(couponRef, {
      usage_count: increment(1),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Error incrementing coupon usage count:", e);
  }
}

export async function createAdminCoupon(coupon: Omit<Coupon, "id">): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!db) return { success: false, error: "Database not available" };
  try {
    const colRef = collection(db, "coupons");
    const docRef = await addDoc(colRef, {
      ...coupon,
      code: coupon.code.trim().toUpperCase(),
      usage_count: 0,
      created_at: new Date().toISOString(),
    });
    return { success: true, id: docRef.id };
  } catch (e: unknown) {
    console.error("Error creating coupon:", e);
    return { success: false, error: e instanceof Error ? e.message : "Failed to create coupon" };
  }
}
