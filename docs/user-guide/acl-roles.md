# ACL - Roles

Roles are named sets of ACL rules that control which MQTT topics a client can publish to or subscribe to. Instead of defining topic permissions on each client individually, you define a role once and assign it to as many clients or groups as needed.

---

## What Roles Are

A role is a reusable permission template. It contains one or more ACL rules, each specifying:

- A **topic pattern** - which topic or set of topics the rule applies to
- An **action** - whether the rule controls publishing, subscribing, or both
- An **effect** - whether the action is allowed or denied

When a client attempts to publish or subscribe, Mosquitto evaluates the ACL rules from all roles assigned to that client (directly and through groups). If a matching allow rule is found, the action proceeds. If a deny rule matches first, the action is blocked.

---

## Creating a Role

1. Navigate to **ACL > Roles** in the sidebar.
2. Click **Add Role**.
3. Enter a **Role Name** - use something descriptive like `sensor-read-only` or `admin-full-access`.
4. Click **Save** to create the role.
5. The role is created empty. Click on it to add ACL rules.

---

## Adding ACL Rules to a Role

Once you have a role, open it and add rules:

1. Click **Add Rule**.
2. Enter a **Topic Pattern** (see topic patterns section below).
3. Select the **Action**:
   - `subscribe` - controls the ability to subscribe to the topic
   - `publish` - controls the ability to publish to the topic
   - `all` - applies to both subscribe and publish
4. Select the **Effect**:
   - `allow` - permit the action
   - `deny` - block the action
5. Click **Save**.

Repeat for each rule you want to add to the role.

---

## Understanding Topic Patterns

Topic patterns support two MQTT wildcards:

### `#` - Multi-level wildcard

Matches everything from that position in the hierarchy downward.

```
sensor/#
```

Matches: `sensor/temp`, `sensor/humidity`, `sensor/floor2/temp`, `sensor/floor2/room1/temp`

Use `#` at the end of a pattern to grant access to an entire subtree.

### `+` - Single-level wildcard

Matches exactly one topic level.

```
sensor/+/temperature
```

Matches: `sensor/kitchen/temperature`, `sensor/bedroom/temperature`

Does NOT match: `sensor/temperature`, `sensor/floor2/room1/temperature`

### Examples of topic patterns

| Pattern | Matches |
|---------|---------|
| `sensor/temp` | Exact topic only |
| `sensor/#` | All topics under sensor/ |
| `sensor/+/temp` | One level deep under sensor/, ending in /temp |
| `#` | Every topic on the broker |
| `home/+/+/status` | Two levels under home/, ending in /status |

---

## Assigning a Role to a Client

1. Go to **ACL > Clients**.
2. Find the client and open its detail view.
3. Click **Add Role** under the Roles section.
4. Select the role from the dropdown.
5. Set an optional priority and click **Save**.

The client immediately gains all permissions defined in that role.

---

## Assigning a Role to a Group

1. Go to **ACL > Groups**.
2. Find the group and open its detail view.
3. Click **Add Role**.
4. Select the role.
5. Set an optional priority and click **Save**.

All clients in the group immediately inherit the role's permissions.

---

## Editing a Role

1. Go to **ACL > Roles**.
2. Click on the role name to open it.
3. Add, edit, or delete individual ACL rules.
4. Changes take effect immediately on all clients that have this role assigned.

---

## Deleting a Role

1. Go to **ACL > Roles**.
2. Find the role and click **Delete**.
3. Confirm the deletion.

Deleting a role removes it from all clients and groups that had it assigned. Those clients lose the permissions the role was granting. Make sure you are not removing access that devices depend on.

---

## Priority and Rule Ordering

When a client has multiple roles (from direct assignment and group membership), Mosquitto evaluates rules in priority order. Higher priority numbers take precedence over lower ones.

Within a single role, rules are evaluated in the order they are listed. The first matching rule wins.

**Key points:**

- A `deny` rule matching before an `allow` rule will block the action.
- If no rule matches, the action is denied by default (Mosquitto's default-deny behavior).
- You can use explicit `deny` rules to carve exceptions out of broad `allow` rules.

---

## Best Practice Examples

### `sensor-read-only` role

For sensors that should only publish their data and not subscribe to anything:

| Topic | Action | Effect |
|-------|--------|--------|
| `sensor/+/data` | publish | allow |

### `actuator-write` role

For actuators that receive commands:

| Topic | Action | Effect |
|-------|--------|--------|
| `actuator/+/command` | subscribe | allow |
| `actuator/+/status` | publish | allow |

### `monitor-subscribe-all` role

For a dashboard or monitoring tool that reads everything:

| Topic | Action | Effect |
|-------|--------|--------|
| `#` | subscribe | allow |

### `admin-full-access` role

For administrative clients that need unrestricted access:

| Topic | Action | Effect |
|-------|--------|--------|
| `#` | all | allow |

### Deny exception pattern

Allow everything in a subtree except one sensitive topic:

| Topic | Action | Effect | Priority |
|-------|--------|--------|----------|
| `home/private/#` | all | deny | 10 |
| `home/#` | all | allow | 5 |

Higher priority deny rule blocks the private subtree even though the broader allow rule would otherwise permit it.
