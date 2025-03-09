/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
<script setup lang="ts">
import { shallowRef } from 'vue';
import {  BrandLinkedinIcon, BrandRedditIcon, BookIcon, LinkIcon } from 'vue-tabler-icons';
export interface menu {
  header?: string;
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
  isHeader?: boolean;
  iconOnly?: boolean;
}



const footerLink : menu[] = [
  {
    title: 'Documentation',
    icon: BookIcon,
    to: 'https://bunkeriot.github.io/BunkerM/'
  },
  {
    title: 'Connect',
    icon: LinkIcon,
    isHeader: true
  },
  {
    
    icon: BrandLinkedinIcon,
    to: 'https://www.linkedin.com/in/mehdi-idrissi/',
    iconOnly: true
  },
  {
   
    icon: BrandRedditIcon,
    to: 'https://www.reddit.com/r/BunkerM/',
    iconOnly: true
  }
];
</script>
<template>
  <v-footer class="px-0 footer">
    <v-row justify="center" no-gutters>
      <v-col cols="6">
        <p class="text-caption mb-0">© All rights reserved</p>
      </v-col>
      <v-col class="text-right" cols="6">
        <template v-for="(item, i) in footerLink" :key="i">
          <span v-if="item.isHeader" class="mx-2 text-caption text-darkText d-inline-flex align-center">
            <component :is="item.icon" size="18" class="mr-1" />{{ item.title }}
          </span>
          <a 
            v-else 
            class="mx-2 text-caption text-darkText d-inline-flex align-center" 
            :href="item.to || '/'"
            target="_blank"
            rel="noopener noreferrer"
          >
            <component :is="item.icon" :size="item.iconOnly ? 22 : 18" :class="{'mr-1': !item.iconOnly}" />
            <span v-if="!item.iconOnly">{{ item.title }}</span>
          </a>
        </template>
      </v-col>
    </v-row>
  </v-footer>
</template>
