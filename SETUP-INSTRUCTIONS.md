# 🚨 CRITICAL SETUP - MUST DO THIS FIRST!

## Why Edit Profile Doesn't Work

Your app is getting "permission denied" errors because **Supabase database security (RLS) is blocking all updates**.

You MUST run this SQL script in Supabase to fix it.

---

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to: **https://supabase.com/dashboard**
- Login with your account
- Click on your **Novea project**

### 2. Open SQL Editor
- Look at the left sidebar
- Click **"SQL Editor"** (icon looks like a database)
- Click the **"New query"** button (green button, top right)

### 3. Copy This SQL Code

```sql
-- Add columns for avatar and bio
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Success message
SELECT 'SETUP COMPLETE - Edit Profile should work now!' as message;
```

### 4. Paste and Run
- **Paste** the SQL code into the editor
- Click **"Run"** button (or press Ctrl+Enter)
- **WAIT** for it to finish (5-10 seconds)

### 5. Check Results
You should see at the bottom:
```
message: "SETUP COMPLETE - Edit Profile should work now!"
```

If you see **any red error messages**, take a screenshot and send to me!

---

## After Running SQL

1. **Reload your app** (close and reopen Expo Go, or refresh browser)
2. **Login** again
3. Go to **Profile** → **Edit Profile**
4. Try **uploading avatar** → should work!
5. Try **editing name/bio** → should save!

---

## If It Still Doesn't Work

Send me:
1. **Screenshot** of the SQL results from Supabase
2. **Screenshot** of the error in Expo Go (shake phone → show dev menu → show errors)
3. Tell me: "I ran the SQL and here's what happened..."

The SQL MUST be run for Edit Profile to work. No exceptions!
