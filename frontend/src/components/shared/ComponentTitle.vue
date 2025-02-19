<script setup lang="ts">
import { GlobalOutlined, NodeExpandOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  title: String,
  subContent: String,
  path: String,
  link: String
});
</script>

// ===============================|| Component title ||=============================== //
<template>
  <v-row class="mb-0 mt-n3">
    <v-col cols="12" md="12">
      <v-card elevation="0" variant="text">
        <v-row no-gutters class="align-center">
          <v-col sm="12">
            <h2 class="text-h2 mb-2">{{ props.title }}</h2>
            <h6 class="text-h6 text-lightText mb-5">{{ props.subContent }}</h6>
            <div class="d-flex align-center mb-2 text-caption text-lightText">
              <NodeExpandOutlined class="mr-2" />
              <span>{{ props.path }}</span>
            </div>
            <a :href="props.link" class="d-inline-flex align-center text-primary text-caption link-hover" target="_blank">
              <GlobalOutlined class="mr-2" />
              <span>{{ props.link }}</span>
            </a>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>
