# ACL - Clients

ACL Clients are the MQTT client accounts registered in your broker's dynamic security system. Each client has credentials (username and password) that devices use to authenticate when connecting to the broker. From the ACL Clients page you can create, configure, and manage every client account on your broker.

---

## What ACL Clients Are

An ACL client is an MQTT account entry that controls:

- **Authentication** - the username and password a device uses to connect
- **Authorization** - what topics the client can publish to and subscribe to, either directly via assigned roles or indirectly via group membership

Every device that connects to your BunkerM broker should have its own client entry. This gives you full visibility and control over who is connecting and what they can do.

---

## Creating a New Client

1. Navigate to **ACL > Clients** in the sidebar.
2. Click **Add Client** (or the "+" button).
3. Enter a **Client ID** - this is the MQTT client identifier. It must be unique.
4. Enter a **Username** - used for authentication.
5. Enter a **Password** - the broker stores this as a secure hash.
6. Optionally set the client status to **Enabled** or **Disabled** at creation time.
7. Click **Save**.

The client is immediately active and can connect to the broker using the provided credentials.

**Naming tip:** Use descriptive, consistent names. For example: `sensor-living-room-01`, `actuator-hvac`, `dashboard-monitor`. This makes ACL management and logs much easier to read.

---

## Enabling and Disabling a Client

You can toggle a client's enabled state directly from the ACL Clients page:

- **Enabled** - the client can connect and exchange messages normally.
- **Disabled** - the client cannot connect. If currently connected, it will be kicked from the broker immediately.

To change the state, find the client in the list and click its enable/disable toggle. The change takes effect instantly on the broker.

**Note:** Disabling from the ACL Clients page and disabling from the Connected Clients page are the same operation. Both update the client's enabled state in Mosquitto's dynamic security.

---

## Assigning Roles to a Client

Roles define what topics a client can access. You can assign one or more roles directly to a client:

1. Find the client in the ACL Clients list.
2. Click the client to open its detail view, or click the **Roles** action button.
3. Click **Add Role**.
4. Select the role from the dropdown list.
5. Optionally set a **priority** (higher priority roles are evaluated first when rules conflict).
6. Click **Save**.

The client now inherits all ACL rules defined in that role. You can assign multiple roles to the same client.

---

## Assigning Groups to a Client

Groups let you manage permissions for many clients at once. When a client belongs to a group, it inherits all roles assigned to that group.

1. Find the client in the ACL Clients list.
2. Click the client to open its detail view, or click the **Groups** action button.
3. Click **Add to Group**.
4. Select the group from the dropdown.
5. Click **Save**.

The client now inherits all roles from the group, in addition to any roles assigned directly to it. See [ACL Groups](acl-groups.md) for more detail on group permissions.

---

## Changing a Client's Password

1. Find the client in the ACL Clients list.
2. Click the **Edit** button or open the client detail.
3. Enter a new password in the password field.
4. Click **Save**.

The password change takes effect immediately. Any currently connected session using the old password will continue until it disconnects. New connections must use the new password.

---

## Deleting a Client

1. Find the client in the ACL Clients list.
2. Click the **Delete** button.
3. Confirm the deletion.

Deleting a client removes its credentials and all its direct role/group assignments. If the client is currently connected, its session is terminated. This action cannot be undone.

---

## How Credentials Work

BunkerM uses Mosquitto's dynamic security plugin to manage client credentials. When a client connects to the broker:

1. The broker receives the MQTT CONNECT packet with a username and password.
2. Mosquitto checks the credentials against the dynamic security database.
3. If the credentials match and the client is enabled, the connection is allowed.
4. If the client is disabled or the credentials are wrong, the connection is rejected.

Passwords are stored as secure hashes - the broker never stores plaintext passwords.

---

## Import and Export ACL Configuration

BunkerM supports importing and exporting your entire ACL configuration as a JSON file. This is useful for:

- **Backup** - export before making large changes so you can restore if needed.
- **Migration** - move your client configuration from one BunkerM instance to another.
- **Version control** - store your ACL config in a git repository.

To export: click the **Export** button on the ACL Clients page. A JSON file is downloaded containing all clients, roles, and groups.

To import: click the **Import** button and select a previously exported JSON file. The import merges with or replaces your existing configuration depending on the import mode selected.

---

## Importing from a Mosquitto Password File

If you have an existing Mosquitto deployment and a `passwd` file with hashed credentials, you can import it into BunkerM:

1. Go to **ACL > Clients**.
2. Click **Import from Password File**.
3. Upload your Mosquitto `passwd` file.
4. BunkerM creates client entries for each user found in the file.

Note that a password file import creates clients without roles or group assignments. You will need to assign roles after importing.

---

## Best Practices

**One client per device** - avoid sharing credentials between multiple physical devices. If one device is compromised, you can disable just that client without affecting others.

**Least privilege** - assign only the roles a client actually needs. A temperature sensor should not have publish rights to actuator topics.

**Descriptive naming** - use names that identify the device's location and function: `sensor-kitchen-temp`, `lock-front-door`, `hub-floor2`.

**Disable before delete** - when decommissioning a device, disable its client first to immediately cut access, then delete the entry later during cleanup.

**Regular audit** - periodically review your client list and remove entries for devices that are no longer in use.

---

## Difference Between ACL Clients and Connected Clients

The ACL Clients page shows your full account database - all registered MQTT clients whether they are currently online or not. The Connected Clients page shows only clients with an active live connection to the broker right now.

Use ACL Clients for account management. Use Connected Clients for live session monitoring.
