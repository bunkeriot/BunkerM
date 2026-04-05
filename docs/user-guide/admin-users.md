# Admin - Users

The Users admin page manages web UI accounts for the BunkerM dashboard. These are the accounts used to log in to the BunkerM web interface - they are separate from MQTT client credentials.

!!! info "Admin access required"
    Only users with the **admin** role can access the Users page. Regular users cannot view or modify other accounts.

---

## What the Users Admin Page Does

From the Users page you can:

- View all registered BunkerM web UI accounts
- Create new accounts
- Change any user's password
- Change any user's role
- Delete accounts

This page does not manage MQTT broker credentials. For MQTT client accounts, use ACL > Clients.

---

## Who Can Access It

Only users with the **admin** role can access Admin > Users. If you do not see this menu item in the sidebar, your account is a regular user and you do not have admin privileges.

The first account created during initial setup is always assigned the admin role.

---

## User Roles

BunkerM has two web UI roles:

### Admin

Full access to everything in the BunkerM dashboard, including:

- All ACL management (clients, roles, groups)
- All monitoring and logs
- All settings pages
- All integrations
- The Users admin page
- The ability to create, modify, and delete other user accounts

### User (Regular)

Access to monitoring, logs, MQTT browsing, and read-only views. Specific permissions for the regular user role depend on your BunkerM configuration. Regular users cannot access Admin settings or manage other accounts.

---

## Creating a New User

1. Navigate to **Admin > Users**.
2. Click **Add User**.
3. Enter the user's **Email address** - this will be their login username.
4. Enter a **Password** - use a strong password. The user can change this after logging in.
5. Select a **Role** - either `admin` or `user`.
6. Click **Save**.

The account is created immediately. Share the email and password with the user so they can log in.

**Note:** There is no automated email invitation system. You need to share the credentials with the new user through a separate channel.

---

## Changing a User's Password

As an admin, you can reset any user's password:

1. Find the user in the Users list.
2. Click **Edit** or the action menu next to their name.
3. Enter a new password in the password field.
4. Click **Save**.

The change takes effect immediately. If the user is currently logged in, their existing session remains valid until it expires or they log out. They will need the new password on their next login.

---

## Changing a User's Role

1. Find the user in the Users list.
2. Click **Edit**.
3. Change the **Role** dropdown to the new role.
4. Click **Save**.

The role change takes effect on the user's next page navigation or session refresh.

**Caution:** Be careful when demoting an admin account. If you demote the last admin account, no one will have access to admin features. Always ensure at least one admin account exists.

---

## Deleting a User

1. Find the user in the Users list.
2. Click **Delete** in the action menu.
3. Confirm the deletion.

The account is permanently removed. If the user is currently logged in, their session is invalidated and they are logged out immediately.

You cannot delete your own currently logged-in account.

---

## Changing Your Own Password

Any user (admin or regular) can change their own password from the account settings:

1. Click your profile icon or name in the top-right corner of the dashboard.
2. Select **Account Settings** or **Change Password**.
3. Enter your current password for verification.
4. Enter and confirm your new password.
5. Click **Save**.

Your session remains active after changing your own password.

---

## Security Best Practices

**Use strong passwords** - Web UI accounts protect access to your entire broker management interface. Use long, unique passwords for all accounts.

**Limit admin accounts** - Create admin accounts only for users who need full management access. Use regular user accounts for team members who only need to monitor the broker.

**One account per person** - Do not share accounts between people. Individual accounts give you a clear audit trail of who made which changes.

**Remove unused accounts** - When a team member no longer needs access, delete their account immediately.

**Change the default password** - If you are using the default `admin@bunker.local` / `admin123` credentials, change the password immediately after setup. These are public defaults and should not be kept in production.

**Regular review** - Periodically review the user list and remove accounts for people who no longer need access.
