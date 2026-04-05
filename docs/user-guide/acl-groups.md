# ACL - Groups

Groups are collections of MQTT clients that share a common set of role-based permissions. Instead of assigning the same roles to dozens of individual clients, you assign roles to a group and then add clients to that group. Every client in the group automatically inherits those permissions.

---

## What Groups Are

A group is a logical container for clients. Its primary purpose is permission inheritance: any role assigned to a group is automatically applied to every client that belongs to that group.

Groups work alongside direct role assignments. A client's effective permissions are the union of:

1. Roles assigned **directly** to the client
2. Roles assigned to **each group** the client belongs to

This gives you flexible layering: use groups for broad, shared policies and direct role assignments for client-specific exceptions.

---

## Creating a Group

1. Navigate to **ACL > Groups** in the sidebar.
2. Click **Add Group**.
3. Enter a **Group Name** - use something descriptive like `sensors`, `actuators`, or `monitoring-tools`.
4. Click **Save**.

The group is created empty with no members and no roles.

---

## Adding Clients to a Group

There are two ways to add a client to a group:

**From the Group page:**

1. Open the group in **ACL > Groups**.
2. Click **Add Client**.
3. Select the client from the dropdown.
4. Click **Save**.

**From the Client page:**

1. Open the client in **ACL > Clients**.
2. Click **Add to Group**.
3. Select the group.
4. Click **Save**.

Both approaches produce the same result. The client immediately inherits all roles assigned to the group.

---

## Assigning Roles to a Group

1. Open the group in **ACL > Groups**.
2. Click **Add Role**.
3. Select the role from the dropdown.
4. Optionally set a **priority** for this role assignment (see Priority section below).
5. Click **Save**.

All clients currently in the group immediately gain the permissions defined in that role. Any clients added to the group in the future will also inherit this role automatically.

---

## Removing Clients from a Group

1. Open the group in **ACL > Groups**.
2. Find the client in the Members list.
3. Click the **Remove** button next to the client.
4. Confirm the action.

The client immediately loses any permissions it was inheriting from this group (unless it has those same permissions through another group or direct role assignment).

---

## Deleting a Group

1. Go to **ACL > Groups**.
2. Find the group and click **Delete**.
3. Confirm the deletion.

Deleting a group removes all its role assignments and removes all clients from it. The clients themselves are not deleted - they remain in your ACL client list but lose the permissions that came from this group.

---

## Permission Inheritance Model

A client's full permission set is built by combining permissions from all sources:

```
Client Effective Permissions =
    (Direct role assignments to client)
    + (Roles from Group A)
    + (Roles from Group B)
    + (Roles from Group C)
    ...
```

When the broker evaluates whether a client can publish or subscribe to a topic, it checks all of these combined rules, applying priorities to resolve any conflicts.

**Example:**

- Client `sensor-01` is in group `sensors` and group `beta-testers`
- `sensors` group has role `sensor-read-only` (can publish to `sensor/#`)
- `beta-testers` group has role `beta-topics` (can publish to `beta/#`)
- `sensor-01` also has role `alert-publisher` directly assigned (can publish to `alerts/#`)

`sensor-01` can publish to `sensor/#`, `beta/#`, and `alerts/#`.

---

## Priority Setting on Group Assignments

When you assign a role to a group, you can set a priority. Priority determines the order in which rules from different role sources are evaluated when a client belongs to multiple groups.

- Higher priority values are evaluated first.
- The first matching rule wins.
- Use priority to ensure that more specific (higher priority) rules take effect before broader (lower priority) ones.

For most setups, you do not need to change the default priority. It matters when you have deny rules in some roles that need to override allow rules in others.

---

## Practical Use Cases

### IoT sensor fleet

Create a `sensors` group with a `sensor-publish` role that allows publishing to `sensor/#`. Add all your sensor clients to this group. When you add a new sensor device, just create a client and add it to the `sensors` group - no need to configure roles per device.

### Actuator group

Create an `actuators` group with an `actuator-command` role that allows subscribing to `actuator/#/command` and publishing to `actuator/#/status`. All actuator devices get their permissions from this group.

### Monitoring and dashboards

Create a `monitoring` group with a `read-all` role that allows subscribing to `#`. Add all your dashboard clients and monitoring tools to this group. They can observe all traffic without being able to publish.

### Environment-based access

Create separate groups for `production-clients` and `staging-clients` with different topic namespaces. Production clients publish to `prod/#` and staging clients publish to `staging/#`. Same role structure, different groups, clean separation.

### Hierarchical access

Use groups to implement multi-tier access:
- `base-sensors` group: publish to `sensor/#`
- `privileged-sensors` group: publish to `sensor/#` plus subscribe to `config/sensor/#`

A client can belong to both groups and accumulate permissions from each.
