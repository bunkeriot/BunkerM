/* # Copyright (c) 2025 BunkerIoT
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<!-- <template>
  <div class="logo">
    <RouterLink to="/dashboard" aria-label="logo">
      <img src="@\assets\images\logo\BunkerM-Logo.png" alt="Logo" width="118" height="35" />
    </RouterLink>
  </div>
</template>

<script>
export default {
  name: "LogoDark",
};
</script>

<style scoped>
.logo img {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>


 -->

<template>
  <div class="logo-container">
    <RouterLink to="/dashboard" aria-label="logo" class="logo-link">
      <img src="@\assets\images\logo\BunkerM-Logo.png" alt="Logo" class="logo" />
      <div class="logo-text">
        <span class="bunker">Bunker</span><span class="m">M</span>
        <!-- <div class="mqtt">MQTT</div> -->
      </div>
    </RouterLink>
  </div>
</template>

<script>
export default {
  name: "LogoDark",
};
</script>

<style scoped>
.logo-container {
  display: flex;
  align-items: center;
}

.logo-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo {
  display: block;
  max-width: 40px;
  height: auto;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.bunker {
  color: #0d2833;
}

.m {
  color: #1c7dc9;
}

.mqtt {
  color: #1c7dc9;
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
  margin-top: 5px;
}
</style>

