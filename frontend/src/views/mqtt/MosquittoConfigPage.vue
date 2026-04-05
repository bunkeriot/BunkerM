<!-- Copyright (c) 2025 BunkerM

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this file except in compliance with the License.  
You may obtain a copy of the License at:

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License. -->
<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center">
        Mosquitto Broker Configuration
        <v-spacer></v-spacer>
      </v-card-title>

      <v-card-text>
        <v-alert v-if="alert.show" :type="alert.type" variant="tonal" class="mb-4" dismissible
          @click:close="alert.show = false">
          {{ alert.message }}
        </v-alert>

        <div class="mb-4">
          <p>Configure your Mosquitto MQTT broker settings. Changes require a broker restart to take effect.</p>
        </div>

        <!-- Current Configuration Summary -->
        <v-card variant="outlined" class="mb-4">
          <v-card-title class="text-subtitle-1">
            <InfoCircleIcon stroke-width="1.5" size="22" class="me-2" />
            Current Configuration Summary
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="d-flex align-center mb-2">
                  <ServerIcon stroke-width="1.5" size="18" class="me-2" />
                  <span class="font-weight-medium">Default Port:</span>
                  <v-chip size="small" color="primary" class="ml-2">{{ config.listener || 1900 }}</v-chip>
                </div>
                <div class="d-flex align-center mb-2">
                  <ShieldCheckIcon stroke-width="1.5" size="18" class="me-2" />
                  <span class="font-weight-medium">Anonymous Access:</span>
                  <v-chip size="small" :color="config.allow_anonymous ? 'warning' : 'success'" class="ml-2">
                    {{ config.allow_anonymous ? 'Enabled' : 'Disabled' }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="d-flex align-center mb-2">
                  <SettingsIcon stroke-width="1.5" size="18" class="me-2" />
                  <span class="font-weight-medium">Max Connections:</span>
                  <v-chip size="small" color="info" class="ml-2">
                    {{ config.max_connections === -1 ? 'Unlimited' : config.max_connections }}
                  </v-chip>
                </div>
                <div class="d-flex align-center mb-2">
                  <ServerIcon stroke-width="1.5" size="18" class="me-2" />
                  <span class="font-weight-medium">Additional Listeners:</span>
                  <v-chip size="small" color="info" class="ml-2">
                    {{ existingListeners.length }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-form ref="form" @submit.prevent="saveConfiguration">
          <!-- Configuration Sections -->
          <v-expansion-panels v-model="openPanel">
            <!-- General Configuration -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <SettingsIcon stroke-width="1.5" size="22" class="me-2" />
                  General Configuration
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <!--                   <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.port"
                      label="Default Port"
                      type="number"
                      hint="Default listener port (standard is 1883, SSL/TLS is 8883)"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Port to use for the default MQTT listener.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.bind_address" label="Bind Address"
                      hint="IP address/hostname to bind the listener to (empty for all interfaces)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          IP address/hostname to bind the default listener to. If not given, the listener will be accessible to all network
                          interfaces.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col> -->

                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.max_connections" label="Max Connections" type="number"
                      hint="Maximum client connections allowed (-1 for unlimited)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The maximum number of client connections to allow. Default is -1 (unlimited). Note that system
                          limits typically
                          restrict this to around 1024 connections.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.max_inflight_messages" label="Max Inflight Messages" type="number"
                      hint="Maximum QoS 1 and 2 messages in flight per client (0 for unlimited)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The maximum number of QoS 1 and 2 messages currently inflight per client. Default is 20. Set
                          to 0 for unlimited.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.max_queued_messages" label="Max Queued Messages" type="number"
                      hint="Maximum queued QoS 1 and 2 messages (0 for unlimited, not recommended)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The maximum number of QoS 1 and 2 messages to hold in a queue above those currently in-flight.
                          Default is 100. Set
                          to 0 for unlimited.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.message_size_limit" label="Message Size Limit" type="number"
                      hint="Maximum publish payload size in bytes (0 for default limit)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The maximum publish payload size that the broker will allow. Default is 0 (accepts all valid
                          MQTT messages up to the
                          MQTT protocol limit of 268,435,455 bytes).
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-switch v-model="config.queue_qos0_messages" color="primary" label="Queue QoS 0 Messages"
                      hint="Queue QoS 0 messages for disconnected persistent clients" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Set to true to queue QoS 0 messages for disconnected persistent clients. These messages are
                          included in the limit
                          set by max_queued_messages.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-switch v-model="config.allow_zero_length_clientid" color="primary"
                      label="Allow Zero Length Client ID"
                      hint="Allow MQTT v3.1.1 clients to connect with an empty client ID" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          If true, clients can connect with a zero-length client ID and will be assigned one by the
                          broker. Only works for
                          clients with clean session set to true.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Security Configuration -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <ShieldCheckIcon stroke-width="1.5" size="22" class="me-2" />
                  Security Configuration
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-switch v-model="config.allow_anonymous" color="primary" label="Allow Anonymous Access"
                      hint="Allow clients to connect without authentication" persistent-hint
                      @update:model-value="checkAnonymousAccess">
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          When set to false, clients must provide a username and password to connect. Enabling this
                          might affect your
                          security setup.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>

                  <!--                   <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.password_file"
                      label="Password File"
                      hint="Path to the mosquitto password file"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Path to the password file for client authentication. Default path should be /etc/mosquitto/mosquitto_passwd.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col> -->

                  <!--                   <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.acl_file"
                      label="ACL File"
                      hint="Path to the Access Control List file"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Path to the Access Control List file that defines topic access permissions.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>
 -->
                  <v-col cols="12" md="6">
                    <v-text-field v-model="config.clientid_prefixes" label="Client ID Prefixes"
                      hint="Allowed client ID prefixes (comma-separated)" persistent-hint>
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          If set, only clients with matching prefixes on their client IDs will be allowed to connect.
                          Leave empty to
                          allow all client IDs.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- Persistence Configuration -->
            <!--             <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <DatabaseIcon stroke-width="1.5" size="22" class="me-2" />
                  Persistence Configuration
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="config.persistence"
                      color="primary"
                      label="Enable Persistence"
                      hint="Save persistent message data to disk"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Enable to save subscription data and retained messages to disk.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.persistence_location"
                      label="Persistence Location"
                      hint="Directory for the persistence database"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Location for the persistence database. Must include trailing /. Default location is /var/lib/mosquitto/.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.persistence_file"
                      label="Persistence File"
                      hint="Filename for the persistence database"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The filename to use for the persistence database, not including the path.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="config.autosave_interval"
                      label="Autosave Interval"
                      type="number"
                      hint="Seconds between persistence database saves (0 for save on exit only)"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The number of seconds between autosaves of the persistence database. 0 means only save on broker exit.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="config.autosave_on_changes"
                      color="primary"
                      label="Autosave on Changes"
                      hint="Save persistence database when changes exceed threshold"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          If true, broker will count subscription changes and save the database when the total exceeds autosave_interval.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel>
 -->
            <!-- Logging Configuration -->
            <!--             <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <FileTextIcon stroke-width="1.5" size="22" class="me-2" />
                  Logging Configuration
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="config.log_dest"
                      :items="logDestOptions"
                      label="Log Destination"
                      hint="Where logs should be written to"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Possible destinations: stdout, stderr, syslog, file. For file, you must specify a file path.
                        </v-tooltip>
                      </template>
                    </v-select>
                  </v-col>

                  <v-col cols="12" md="6" v-if="config.log_dest === 'file'">
                    <v-text-field
                      v-model="config.log_file"
                      label="Log File Path"
                      hint="Path to the log file"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          The file path where logs will be written.
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-select
                      v-model="config.log_type"
                      :items="logTypeOptions"
                      label="Log Types"
                      multiple
                      chips
                      hint="Types of messages to log"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          Possible types: debug, error, warning, notice, information, none, subscribe, unsubscribe, all.
                        </v-tooltip>
                      </template>
                    </v-select>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="config.connection_messages"
                      color="primary"
                      label="Connection Messages"
                      hint="Log client connection and disconnection messages"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          If set to true, client connection and disconnection messages will be included in the log.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-switch
                      v-model="config.log_timestamp"
                      color="primary"
                      label="Log Timestamps"
                      hint="Add timestamps to log messages"
                      persistent-hint
                    >
                      <template v-slot:append>
                        <v-tooltip location="bottom">
                          <template v-slot:activator="{ props }">
                            <v-icon v-bind="props" color="info">mdi-information-outline</v-icon>
                          </template>
                          If set to true, add a timestamp value to each log message.
                        </v-tooltip>
                      </template>
                    </v-switch>
                  </v-col>
                </v-row>
              </v-expansion-panel-text>
            </v-expansion-panel> -->

            <!-- Additional Listeners -->
            <v-expansion-panel>
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <ServerIcon stroke-width="1.5" size="22" class="me-2" />
                  Additional Listeners
                </div>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <!-- Help section -->
                <v-alert type="info" variant="tonal" class="mb-4">
                  <div class="font-weight-bold mt-2 pa-2 border border-warning rounded">
                    <p class="mb-0">Important: Additional listeners must use different ports than the default port ({{ config.listener || 1900 }}).</p>
                    <p class="mb-0">Each listener must have a unique port number between 1 and 65535.</p>
                    <p v-if="existingListeners.some(l => Number(l.port) === 8080)" class="mb-0 mt-2 text-warning">
                      Note: Port 8080 is already in use by an existing listener and cannot be used for new listeners.
                    </p>
                    <p class="mb-0 mt-2 text-warning">
                      <strong>Important:</strong> Port 8080 is reserved for Mosquitto's default configuration and cannot be used for additional listeners.
                    </p>
                  </div>
                </v-alert>
                
                <v-row>
                  <v-col cols="12">
                    <v-btn color="success" @click="addListener" class="mb-4">
                      <PlusIcon stroke-width="1.5" size="22" class="me-2" /> Add Listener
                    </v-btn>
                  </v-col>
                </v-row>

                <div v-for="(listener, index) in listeners" :key="index" class="mb-6 pa-4 border rounded">
                  <div class="d-flex justify-space-between align-center mb-2">
                    <h3 class="text-subtitle-1">Listener {{ index + 1 }}</h3>
                    <v-btn color="error" icon @click="removeListener(index)">
                      <TrashIcon stroke-width="1.5" size="22" />
                    </v-btn>
                  </div>

                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field 
                        v-model="listener.port" 
                        label="Port" 
                        type="number"
                        hint="Port number for this listener" 
                        persistent-hint
                        :error-messages="getPortErrorMessage(listener.port, index)"
                        @update:model-value="(val) => { listener.port = Number(val); }"
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model="listener.bind_address" label="Bind Address"
                        hint="IP address/hostname to bind (empty for all interfaces)" persistent-hint></v-text-field>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-switch v-model="listener.per_listener_settings" color="primary" label="Per Listener Settings"
                        hint="This listener has unique settings" persistent-hint></v-switch>
                    </v-col>

                    <v-col cols="12" md="6">
                      <v-text-field v-model="listener.max_connections" label="Max Connections" type="number"
                        hint="Maximum client connections allowed (-1 for unlimited)" persistent-hint></v-text-field>
                    </v-col>
                  </v-row>
                </div>
                
                <!-- No listeners message -->
                <v-alert v-if="listeners.length === 0 && existingListeners.length === 0" type="info" variant="tonal" class="mt-3">
                  No additional listeners have been added. Click "Add Listener" to create a new listener configuration.
                </v-alert>

                <!-- Existing listeners from backend -->
                <div v-if="existingListeners.length > 0" class="mt-6">
                  <h3 class="text-subtitle-1 mb-3">Existing Listeners</h3>

                  
                  <!-- Search Bar -->
                  <div class="mb-4">
                    <v-text-field
                      v-model="listenerSearch"
                      prepend-inner-icon="mdi-magnify"
                      label="Search listeners"
                      single-line
                      hide-details
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </div>
                  
                  <!-- Listeners Table -->
                  <v-data-table
                    :headers="listenerHeaders"
                    :items="existingListeners"
                    :search="listenerSearch"
                    hover
                    class="elevation-1 mb-4"
                    :items-per-page="5"
                    :items-per-page-options="[5, 10, 20]"
                  >
                    <template v-slot:item.port="{ item }">
                      <v-chip size="small" color="info">{{ item.port }}</v-chip>
                    </template>
                    
                    <template v-slot:item.bind_address="{ item }">
                      {{ item.bind_address || 'All Interfaces' }}
                    </template>
                    
                    <template v-slot:item.max_connections="{ item }">
                      {{ item.max_connections === -1 ? 'Unlimited' : item.max_connections }}
                    </template>
                    
                    <template v-slot:item.actions="{ item, index }">
                      <v-btn color="error" icon size="small" @click="removeExistingListener(index)">
                        <TrashIcon stroke-width="1.5" size="18" />
                      </v-btn>
                    </template>
                  </v-data-table>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <div class="d-flex justify-end mt-4 gap-2">
            <v-btn color="warning" @click="setDefaultConfig">
              <RefreshIcon stroke-width="1.5" size="22" class="me-2" /> Set as Default
            </v-btn>
          </div>


          <div class="d-flex justify-end mt-4 gap-2">
            <v-btn color="primary" type="submit" :loading="loading">
              <UploadIcon v-if="!loading" stroke-width="1.5" size="22" class="me-2" />
              Save Configuration
            </v-btn>
          </div>
        </v-form>

        <v-divider class="my-6"></v-divider>

        <div v-if="saveResults.success !== null" class="mt-4">
          <v-alert :type="saveResults.success ? 'success' : 'error'" variant="tonal" class="mb-4">
            {{ saveResults.message }}
          </v-alert>

          <v-card variant="outlined" class="mb-4" v-if="saveResults.success">
            <v-card-text>
              <p class="mb-2">Your configuration has been saved successfully. For changes to take effect, restart the
                Mosquitto
                broker.</p>
              <v-btn color="primary" variant="tonal" @click="showRestartDialog = true" class="mt-2">
                <RefreshIcon stroke-width="1.5" size="22" class="me-2" />
                Restart Mosquitto
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <!-- Anonymous Warning Dialog -->
    <v-dialog v-model="showAnonymousWarning" max-width="500px">
      <v-card>
        <v-card-title class="text-warning">
          Warning: Anonymous Access
        </v-card-title>
        <v-card-text>
          <p>Enabling anonymous access will allow clients to connect without authentication. This will affect your
            security
            setup and may conflict with Dynamic Security and password authentication methods.</p>
          <p class="mt-2 font-weight-bold">Are you sure you want to enable anonymous access?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="cancelAnonymousAccess">No, Keep It Secure</v-btn>
          <v-btn color="warning" @click="confirmAnonymousAccess">Yes, Enable Anonymous Access</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart Confirmation Dialog -->
    <v-dialog v-model="showRestartDialog" max-width="500px">
      <v-card>
        <v-card-title>Restart Mosquitto Broker</v-card-title>
        <v-card-text>
          <p>The configuration has been saved successfully. For the changes to take effect, the Mosquitto broker needs
            to be
            restarted.</p>
          <p class="mt-2 text-warning">Note: Restarting the broker will temporarily disconnect all MQTT clients.</p>
          <p class="mt-2">Would you like to restart the Mosquitto broker now?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="showRestartDialog = false">Later</v-btn>
          <v-btn color="primary" @click="restartMosquitto" :loading="restarting">
            <RefreshIcon v-if="!restarting" stroke-width="1.5" size="18" class="me-2" />
            Restart Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Restart Result Dialog -->
    <v-dialog v-model="showRestartResultDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span :class="restartSuccess ? 'text-success' : 'text-error'">
            {{ restartSuccess ? 'Restart Successful' : 'Restart Failed' }}
          </span>
        </v-card-title>
        <v-card-text>
          <p>{{ restartMessage }}</p>
          <v-alert v-if="!restartSuccess" type="warning" variant="tonal" class="mt-2">
            You may need to restart the Mosquitto broker manually for changes to apply.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showRestartResultDialog = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { mqttService } from '@/services/mqtt.service';
import { useSnackbar } from '@/composables/useSnackbar';
import {
  SettingsIcon,
  ShieldCheckIcon,
  DatabaseIcon,
  FileTextIcon,
  ServerIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  RefreshIcon,
  InfoCircleIcon
} from 'vue-tabler-icons';

const { showSuccess, showError } = useSnackbar();

// Form state
const form = ref(null);
const loading = ref(false);
const openPanel = ref(0);

// Restart dialog state
const showRestartDialog = ref(false);
const showRestartResultDialog = ref(false);
const restarting = ref(false);
const restartSuccess = ref(false);
const restartMessage = ref('');

// Anonymous warning dialog
const showAnonymousWarning = ref(false);
const originalAnonymousValue = ref(false);

// Alert state
const alert = reactive({
  show: false,
  type: 'info',
  message: ''
});

// Save results
const saveResults = reactive({
  success: null,
  message: ''
});

// Default configuration based on your requirements
const defaultConfig = {
  // General
  listener: 1900,

  // Security
  allow_anonymous: false,
  password_file: '/etc/mosquitto/mosquitto_passwd',

  // Persistence
  persistence: true,
  persistence_location: '/var/lib/mosquitto/',
  persistence_file: 'mosquitto.db',


  // Logging
  log_dest: 'file /var/log/mosquitto/mosquitto.log',
  log_type: 'all',
  log_timestamp: 'true',

  // Additional settings
  per_listener_settings: false,
  plugin: '/usr/lib/mosquitto_dynamic_security.so',
  plugin_opt_config_file: '/var/lib/mosquitto/dynamic-security.json'
};

// Configuration state
const config = reactive({ ...defaultConfig });

// Listeners configuration
const listeners = ref([]);

// Store existing listeners from the backend
const existingListeners = ref([]);

// Search and table configuration for existing listeners
const listenerSearch = ref('');
const listenerHeaders = [
  { title: 'Port', key: 'port', sortable: true },
  { title: 'Bind Address', key: 'bind_address', sortable: true },
  { title: 'Max Connections', key: 'max_connections', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
];

// Log destination options
const logDestOptions = [
  'stdout',
  'stderr',
  'syslog',
  'file',
  'topic',
  'none'
];

// Log type options
const logTypeOptions = [
  'debug',
  'error',
  'warning',
  'notice',
  'information',
  'none',
  'subscribe',
  'unsubscribe',
  'websockets',
  'all'
];

// Load the current configuration
onMounted(async () => {
  await loadConfiguration();
});

// Load configuration from backend
async function loadConfiguration() {
  try {
    loading.value = true;
    
    // Clear existing listeners to avoid validation errors during loading
    existingListeners.value = [];
    
    const response = await mqttService.getMosquittoConfig();

    if (response && response.success) {
      // Merge the response into our config object
      Object.keys(response.config).forEach(key => {
        // Convert string 'true'/'false' to boolean for boolean fields
        if (typeof defaultConfig[key] === 'boolean') {
          config[key] = response.config[key] === 'true' || response.config[key] === true;
        } else if (!isNaN(response.config[key]) && typeof defaultConfig[key] === 'number') {
          // Convert numeric strings to numbers for number fields
          config[key] = Number(response.config[key]);
        } else {
          config[key] = response.config[key];
        }
      });

      // Get the default port
      const defaultPort = Number(config.listener);
      console.log('Default port when loading:', defaultPort);
      
      // Log all listeners from the backend for debugging
      if (response.listeners && Array.isArray(response.listeners)) {
        console.log('All listeners from backend:', response.listeners);
      }

      // Store existing listeners in a separate variable but don't add them to the UI
      // Filter out any listeners that use the default port or port 8080
      if (response.listeners && Array.isArray(response.listeners)) {
        // Create a set to track unique ports to avoid duplicates
        const uniquePorts = new Set();
        
        // Add default port to the set
        if (defaultPort) {
          uniquePorts.add(defaultPort);
          console.log(`Added default port ${defaultPort} to unique ports set`);
        }
        
        // Add port 8080 to the set
        uniquePorts.add(8080);
        console.log(`Added reserved port 8080 to unique ports set`);
        
        existingListeners.value = response.listeners
          .filter(listener => {
            const listenerPort = Number(listener.port);
            
            // Skip invalid ports
            if (!listenerPort || listenerPort <= 0 || listenerPort > 65535) {
              console.log(`Filtering out listener with invalid port: ${listener.port}`);
              return false;
            }
            
            // Skip default port
            const isDefaultPort = listenerPort === defaultPort;
            if (isDefaultPort) {
              console.log(`Filtering out existing listener with default port ${defaultPort}`);
              return false;
            }
            
            // Skip port 8080
            const isPort8080 = listenerPort === 8080;
            if (isPort8080) {
              console.log(`Filtering out existing listener with port 8080 (reserved port)`);
              return false;
            }
            
            // Skip duplicate ports
            if (uniquePorts.has(listenerPort)) {
              console.log(`Filtering out duplicate listener with port ${listenerPort}`);
              return false;
            }
            
            // Add this port to the set of unique ports
            uniquePorts.add(listenerPort);
            console.log(`Added port ${listenerPort} to unique ports set`);
            
            return true;
          })
          .map(listener => ({
            port: Number(listener.port) || 1883,
            bind_address: listener.bind_address || '',
            per_listener_settings: listener.per_listener_settings === 'true' || listener.per_listener_settings === true,
            max_connections: listener.max_connections ? Number(listener.max_connections) : -1
          }));
        
        console.log('Filtered existing listeners:', existingListeners.value);
        console.log('Unique ports in use:', Array.from(uniquePorts).sort((a, b) => a - b));
      }

      showSuccess('Configuration loaded successfully');
    } else {
      showError('Failed to load configuration');
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    showError('Failed to load configuration');
  } finally {
    loading.value = false;
  }
}

// Add a new listener
function addListener() {
  // Default port to use when adding a new listener
  const defaultPort = 1883;
  
  // Create a set of used ports
  const usedPorts = new Set();
  
  // Add the default listener port to used ports
  if (config.listener) {
    usedPorts.add(Number(config.listener));
    console.log(`Adding default port ${config.listener} to used ports`);
  }
  
  // Add existing listener ports to the set
  listeners.value.forEach(listener => {
    if (listener.port && listener.port > 0 && listener.port <= 65535) {
      usedPorts.add(Number(listener.port));
      console.log(`Adding new listener port ${listener.port} to used ports`);
    }
  });
  
  // Add existing backend listener ports to the set
  // Only add ports that are actually in use by existing listeners
  existingListeners.value.forEach(listener => {
    if (listener.port && listener.port > 0 && listener.port <= 65535) {
      usedPorts.add(Number(listener.port));
      console.log(`Adding existing listener port ${listener.port} to used ports`);
    }
  });
  
  // Always add port 8080 to used ports to avoid suggesting it
  usedPorts.add(8080);
  console.log('Adding port 8080 to used ports to avoid conflicts');
  
  // Debug information
  console.log('Used ports for new listener:', Array.from(usedPorts).sort((a, b) => a - b));
  
  // Find an available port starting from the default
  let newPort = defaultPort;
  while (usedPorts.has(newPort)) {
    newPort++;
    // Avoid going beyond the valid port range
    if (newPort > 65535) {
      newPort = 1024; // Start from a common non-privileged port
      break;
    }
  }
  
  console.log('Selected new port:', newPort);
  
  // Create a new listener with the selected port
  const newListener = {
    port: newPort,
    bind_address: '',
    per_listener_settings: false,
    max_connections: -1
  };
  
  // Add the new listener to the list
  listeners.value.push(newListener);
  console.log('Added new listener:', newListener);
}

// Remove a listener
function removeListener(index) {
  listeners.value.splice(index, 1);
}

// Check and warn when anonymous access is enabled
function checkAnonymousAccess(value) {
  if (value === true) {
    originalAnonymousValue.value = false;
    showAnonymousWarning.value = true;
  }
}

// Confirm enabling anonymous access
function confirmAnonymousAccess() {
  config.allow_anonymous = true;
  showAnonymousWarning.value = false;
}

// Cancel enabling anonymous access
function cancelAnonymousAccess() {
  config.allow_anonymous = false;
  showAnonymousWarning.value = false;
}

// Reset to default configuration
function setDefaultConfig() {
  Object.keys(defaultConfig).forEach(key => {
    config[key] = defaultConfig[key];
  });

  listeners.value = [];
  existingListeners.value = [];

  alert.show = true;
  alert.type = 'info';
  alert.message = 'Configuration has been reset to default values. Click Save to apply these changes.';
}

function validateConfiguration() {
  // Check for duplicate listener ports and conflicts
  let error = null;
  
  // Debug information about all ports in use
  console.log('Validation - Default port:', Number(config.listener));
  console.log('Validation - Existing listeners:', existingListeners.value.map(l => Number(l.port)));
  console.log('Validation - New listeners:', listeners.value.map(l => Number(l.port)));
  
  // Check each listener for conflicts
  for (const [index, listener] of listeners.value.entries()) {
    // Check for empty or invalid ports first
    if (!listener.port || listener.port <= 0 || listener.port > 65535) {
      error = `Listener ${index + 1} has an invalid port number. Port must be between 1 and 65535.`;
      break;
    }
    
    // Special handling for port 8080
    if (Number(listener.port) === 8080) {
      error = `Port 8080 is reserved for Mosquitto's default configuration. Please use a different port.`;
      break;
    }
    
    // Check for port conflicts
    const conflicts = checkPortConflicts(listener.port, index);
    
    if (conflicts.length > 0) {
      // Create a more specific error message based on the conflict type
      if (conflicts.some(c => c.includes('Default Mosquitto listener'))) {
        error = `Listener ${index + 1} (Port ${listener.port}) conflicts with the default Mosquitto listener. Please use a different port.`;
      } else if (conflicts.some(c => c.includes('reserved for Mosquitto'))) {
        error = `Port ${listener.port} is reserved for Mosquitto's default configuration. Please use a different port.`;
      } else if (conflicts.some(c => c.includes('Existing listener'))) {
        error = `Port ${listener.port} is already in use by an existing listener. Please use a different port.`;
      } else if (conflicts.some(c => c.includes('New listener'))) {
        error = `Port ${listener.port} is already used by another listener in this form. Please use a different port.`;
      } else {
        error = `Listener ${index + 1} (Port ${listener.port}) has a conflict. Please use a different port.`;
      }
      break;
    }
  }
  
  if (error) {
    // Show the error in the alert instead of the modal dialog
    alert.show = true;
    alert.type = 'error';
    alert.message = error;
    return false;
  }
  
  return true;
}

// Save configuration
async function saveConfiguration() {
  // Clear any existing error messages
  alert.show = false;
  
  // Validate configuration before saving
  if (!validateConfiguration()) {
    return; // Stop if validation fails
  }
  
  try {
    loading.value = true;

    // Get the default port
    const defaultPort = Number(config.listener);
    console.log('Default port when saving:', defaultPort);
    
    // Create a set of unique ports to avoid duplicates
    const uniquePorts = new Set();
    
    // Add default port to the set
    if (defaultPort) {
      uniquePorts.add(defaultPort);
    }
    
    // Add port 8080 to the set
    uniquePorts.add(8080);
    
    // Filter out any listeners that use the default port or port 8080
    const filteredNewListeners = listeners.value.filter(listener => {
      const listenerPort = Number(listener.port);
      
      // Skip invalid ports
      if (!listenerPort || listenerPort <= 0 || listenerPort > 65535) {
        console.log(`Filtering out listener with invalid port: ${listener.port}`);
        return false;
      }
      
      // Skip default port
      const isDefaultPort = listenerPort === defaultPort;
      if (isDefaultPort) {
        console.log(`Filtering out new listener with default port ${defaultPort}`);
        return false;
      }
      
      // Skip port 8080
      const isPort8080 = listenerPort === 8080;
      if (isPort8080) {
        console.log(`Filtering out new listener with port 8080 (reserved port)`);
        return false;
      }
      
      // Skip duplicate ports
      if (uniquePorts.has(listenerPort)) {
        console.log(`Filtering out duplicate listener with port ${listenerPort}`);
        return false;
      }
      
      // Add this port to the set of unique ports
      uniquePorts.add(listenerPort);
      
      return true;
    });
    
    // Reset uniquePorts for existing listeners
    uniquePorts.clear();
    
    // Add default port to the set again
    if (defaultPort) {
      uniquePorts.add(defaultPort);
    }
    
    // Add port 8080 to the set again
    uniquePorts.add(8080);
    
    // Add all new listener ports to the set
    filteredNewListeners.forEach(listener => {
      uniquePorts.add(Number(listener.port));
    });
    
    const filteredExistingListeners = existingListeners.value.filter(listener => {
      const listenerPort = Number(listener.port);
      
      // Skip invalid ports
      if (!listenerPort || listenerPort <= 0 || listenerPort > 65535) {
        console.log(`Filtering out existing listener with invalid port: ${listener.port}`);
        return false;
      }
      
      // Skip default port
      const isDefaultPort = listenerPort === defaultPort;
      if (isDefaultPort) {
        console.log(`Filtering out existing listener with default port ${defaultPort}`);
        return false;
      }
      
      // Skip port 8080
      const isPort8080 = listenerPort === 8080;
      if (isPort8080) {
        console.log(`Filtering out existing listener with port 8080 (reserved port)`);
        return false;
      }
      
      // Skip duplicate ports (including those already in new listeners)
      if (uniquePorts.has(listenerPort)) {
        console.log(`Filtering out duplicate existing listener with port ${listenerPort}`);
        return false;
      }
      
      // Add this port to the set of unique ports
      uniquePorts.add(listenerPort);
      
      return true;
    });
    
    // Combine filtered listeners
    const allListeners = [...filteredNewListeners, ...filteredExistingListeners];
    console.log('Filtered listeners for saving:', allListeners);
    console.log('Unique ports being saved:', Array.from(uniquePorts).sort((a, b) => a - b));

    // Prepare data for saving
    const saveData = {
      config: { ...config },
      listeners: allListeners
    };

    const response = await mqttService.saveMosquittoConfig(saveData);

    if (response && response.success) {
      saveResults.success = true;
      saveResults.message = response.message || 'Configuration saved successfully';
      showSuccess(saveResults.message);

      // Reload the configuration to ensure we have the latest data
      // Temporarily clear existingListeners to avoid false conflicts during reload
      existingListeners.value = [];
      await loadConfiguration();

      // Show restart dialog after a short delay
      setTimeout(() => {
        showRestartDialog.value = true;
      }, 1000);
    } else {
      saveResults.success = false;
      saveResults.message = response.message || 'Failed to save configuration';
      showError(saveResults.message);
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
    saveResults.success = false;
    saveResults.message = error.message || 'An error occurred while saving configuration';
    showError(saveResults.message);
  } finally {
    loading.value = false;
  }
}

// Restart Mosquitto broker
async function restartMosquitto() {
  try {
    restarting.value = true;

    const response = await mqttService.restartMosquitto();

    restartSuccess.value = response.success;
    restartMessage.value = response.message || (response.success ?
      'Mosquitto broker restarted successfully.' :
      'Failed to restart Mosquitto broker.');

    // Close the confirmation dialog and show result dialog
    showRestartDialog.value = false;

    // Add a small delay before showing result
    setTimeout(() => {
      showRestartResultDialog.value = true;
    }, 500);

    if (response.success) {
      showSuccess('Mosquitto broker restarted successfully');
    } else {
      showError('Failed to restart Mosquitto broker');
    }

  } catch (error) {
    console.error('Error restarting Mosquitto broker:', error);
    restartSuccess.value = false;
    restartMessage.value = error.message || 'An error occurred while restarting the Mosquitto broker.';

    showRestartDialog.value = false;
    showRestartResultDialog.value = true;
    showError('Failed to restart Mosquitto broker');
  } finally {
    restarting.value = false;
  }
}

// Debug function to check port conflicts
function checkPortConflicts(port, currentListenerIndex) {
  if (!port) return [];
  
  const portNum = Number(port);
  const conflicts = [];
  
  // Special handling for port 8080
  if (portNum === 8080) {
    conflicts.push(`Port 8080 is reserved for Mosquitto's default configuration`);
    return conflicts;
  }
  
  // Check if it conflicts with default listener
  if (portNum === Number(config.listener)) {
    conflicts.push(`Default Mosquitto listener on port ${config.listener}`);
  }
  
  // Check if it conflicts with existing listeners from the backend
  // This is the only check we should keep for "already in use" validation
  existingListeners.value.forEach((listener, idx) => {
    if (portNum === Number(listener.port)) {
      conflicts.push(`Existing listener #${idx + 1} on port ${listener.port}`);
    }
  });
  
  // Check if it conflicts with other new listeners in the current editing session
  // But only for duplicate detection within the current form, not for "already in use" messages
  listeners.value.forEach((listener, index) => {
    // Skip checking against itself if currentListenerIndex is provided
    if (currentListenerIndex !== undefined && index === currentListenerIndex) {
      return;
    }
    
    if (portNum === Number(listener.port)) {
      conflicts.push(`New listener #${index + 1} on port ${listener.port}`);
    }
  });
  
  // If conflicts are found, log detailed information for debugging
  if (conflicts.length > 0) {
    console.log(`Port conflict detected for port ${portNum}:`);
    console.log(`- Default port: ${config.listener}`);
    console.log(`- Existing listeners:`, existingListeners.value.map(l => l.port));
    console.log(`- New listeners:`, listeners.value.map(l => l.port));
    console.log(`- Conflicts:`, conflicts);
  }
  
  return conflicts;
}

// New computed function to get port error message
function getPortErrorMessage(port, index) {
  // Don't show error messages during loading/saving
  if (loading.value) return '';
  
  if (!port) return '';
  
  // Special handling for port 8080
  if (Number(port) === 8080) {
    return `Port 8080 is reserved for Mosquitto's default configuration. Please use a different port.`;
  }
  
  const conflicts = checkPortConflicts(port, index);
  if (conflicts.length > 0) {
    // Check for specific types of conflicts and provide appropriate messages
    if (conflicts.some(c => c.includes('reserved for Mosquitto'))) {
      return `Port ${port} is reserved for Mosquitto's default configuration. Please use a different port.`;
    } else if (conflicts.some(c => c.includes('Default Mosquitto listener'))) {
      return `Port ${port} conflicts with the default Mosquitto listener. Please use a different port.`;
    } else if (conflicts.some(c => c.includes('Existing listener'))) {
      // Don't show inline error for existing listener conflicts
      // These will be shown in the top alert during validation
      return '';
    } else if (conflicts.some(c => c.includes('New listener'))) {
      // This is a conflict with another listener being added in the current session
      return `Port ${port} is already used by another listener in this form. Please use a different port.`;
    } else {
      // Generic fallback message
      return `Port ${port} has a conflict. Please use a different port.`;
    }
  }
  return '';
}

// Remove existing listener
function removeExistingListener(index) {
  // Get the listener to be removed
  const listener = existingListeners.value[index];
  console.log(`Removing existing listener at index: ${index}, port: ${listener.port}`);
  
  // Show confirmation dialog
  if (confirm(`Are you sure you want to remove the existing listener on port ${listener.port}?`)) {
    // Show loading state
    loading.value = true;
    
    // Call API to remove the listener from the configuration file
    mqttService.removeMosquittoListener(listener.port)
      .then(response => {
        if (response && response.success) {
          // Remove the listener from the array
          existingListeners.value.splice(index, 1);
          
          // Show success message
          alert.show = true;
          alert.type = 'success';
          alert.message = response.message || `Listener on port ${listener.port} has been removed from the configuration.`;
          
          // Show restart dialog after a short delay
          setTimeout(() => {
            showRestartDialog.value = true;
          }, 1000);
        } else {
          // Show error message
          alert.show = true;
          alert.type = 'error';
          alert.message = response.message || `Failed to remove listener on port ${listener.port}.`;
        }
      })
      .catch(error => {
        console.error('Error removing listener:', error);
        
        // Show error message
        alert.show = true;
        alert.type = 'error';
        alert.message = error.response?.data?.detail || error.message || `An error occurred while removing listener on port ${listener.port}.`;
      })
      .finally(() => {
        loading.value = false;
      });
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>
