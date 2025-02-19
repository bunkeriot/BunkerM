<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

const page = ref({ title: 'Ant design Icons' });
const icons = ref('<iframe src="https://antdv.com/components/icon" frameborder="0"  width="100%" height="600"></iframe>');
const breadcrumbs = ref([
  {
    title: 'Ant design Icons',
    disabled: true,
    href: '#'
  }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="12">
      <UiParentCard title="Ant design Icons">
        <div v-html="icons"></div>
      </UiParentCard>
    </v-col>
  </v-row>
</template>
