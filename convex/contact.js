// convex/contacts.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ────────────────────────────────────────────────────────────────
   1. getAllContacts – Fetch 1-to-1 expense contacts + groups
   ──────────────────────────────────────────────────────────────── */
export const getAllContacts = query({
  handler: async (ctx) => {
    // 🔐 Centralized method se current logged-in user ko fetch kiya
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    /* 🧾 Step 1: Expenses jahan YOU ne paise diye (payer ho) */
    const expensesYouPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", currentUser._id).eq("groupId", undefined)
      )
      .collect();

    /* 🧾 Step 2: Expenses jahan doosra banda payer tha, par YOU included ho (split mein) */
    const expensesNotPaidByYou = (
      await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", undefined)) // Sirf 1-to-1 wale
        .collect()
    ).filter(
      (e) =>
        e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id)
    );

    // 💰 Step 3: Dono tarah ke personal expenses ko combine kar diya
    const personalExpenses = [...expensesYouPaid, ...expensesNotPaidByYou];

    /* 🔍 Step 4: Unique contact user IDs collect karo (jinke saath expense kiya hai) */
    const contactIds = new Set();
    personalExpenses.forEach((exp) => {
      // Agar khud payer nahi ho, to payer ko contact list mein add karo
      if (exp.paidByUserId !== currentUser._id)
        contactIds.add(exp.paidByUserId);

      // Splits mein har user ko check karo (except khud ko)
      exp.splits.forEach((s) => {
        if (s.userId !== currentUser._id) contactIds.add(s.userId);
      });
    });

    /* 📄 Step 5: Contact users ka detailed data fetch karo from database */
    const contactUsers = await Promise.all(
      [...contactIds].map(async (id) => {
        const u = await ctx.db.get(id);
        return u
          ? {
              id: u._id,
              name: u.name,
              email: u.email,
              imageUrl: u.imageUrl,
              type: "user", // type 'user' set kiya for UI to differentiate
            }
          : null; // Agar user record nahi mila to null return karo
      })
    );

    /* 👥 Step 6: Groups jisme current user member hai unhe fetch karo */
    const userGroups = (await ctx.db.query("groups").collect())
      .filter((g) =>
        g.members.some((m) => m.userId === currentUser._id)
      )
      .map((g) => ({
        id: g._id,
        name: g.name,
        description: g.description,
        memberCount: g.members.length,
        type: "group", // tag added to mark this as a group (not user)
      }));

    /* 🔡 Step 7: Alphabetical sorting for better UX */
    contactUsers.sort((a, b) => a?.name.localeCompare(b?.name));
    userGroups.sort((a, b) => a.name.localeCompare(b.name));

    /* 📤 Step 8: Final return — null users hata ke and groups include karke */
    return { 
      users: contactUsers.filter(Boolean), 
      groups: userGroups 
    };
  },
});

/* ────────────────────────────────────────────────────────────────
   2. createGroup – New group banane ka logic
   ──────────────────────────────────────────────────────────────── */
export const createGroup = mutation({
  args: {
    name: v.string(),                          // Group ka naam (required)
    description: v.optional(v.string()),       // Description (optional)
    members: v.array(v.id("users")),           // Group ke members ke user IDs
  },
  handler: async (ctx, args) => {
    // 🔐 Current logged-in user fetch karo (creator hoga group ka)
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    // ❌ Group name blank nahi hona chahiye
    if (!args.name.trim()) throw new Error("Group name cannot be empty");

    // 👥 Members ko ek Set mein daala to ensure uniqueness
    const uniqueMembers = new Set(args.members);
    uniqueMembers.add(currentUser._id); // Group banane wala user bhi add kar do

    // ✅ Har user ka existence check karo (safety check)
    for (const id of uniqueMembers) {
      if (!(await ctx.db.get(id)))
        throw new Error(`User with ID ${id} not found`);
    }

    // 🏗️ Final group object ko DB mein insert karo
    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description?.trim() ?? "", // optional description
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member", // creator is admin
        joinedAt: Date.now(), // joining timestamp
      })),
    });
  },
});
