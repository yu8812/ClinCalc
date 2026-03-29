-- ══════════════════════════════════════════════
--  ClinCalc — Role 權限系統
--  在 Supabase SQL Editor 貼上全部執行
-- ══════════════════════════════════════════════

-- 1. profiles 加入 role 欄位（預設 user）
alter table profiles
  add column if not exists role text not null default 'user'
  check (role in ('user', 'doctor', 'admin'));

-- 2. 防止用戶自己改 role（只有後台 SQL 才能改）
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles where id = auth.uid())
  );

-- 3. medications：只有 doctor/admin 可以寫入，其他人只能讀
drop policy if exists "Doctors can write medications" on medications;
create policy "Doctors can write medications" on medications
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('doctor', 'admin')
    )
  );

-- 4. medical_references：只有 doctor/admin 可以寫入
drop policy if exists "Doctors can write medical_references" on medical_references;
create policy "Doctors can write medical_references" on medical_references
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('doctor', 'admin')
    )
  );

-- ══════════════════════════════════════════════
--  執行完畢後，手動設定醫生帳號（換成實際 email）：
--
--  update profiles set role = 'doctor'
--  where id = (
--    select id from auth.users where email = 'doctor@example.com'
--  );
-- ══════════════════════════════════════════════
