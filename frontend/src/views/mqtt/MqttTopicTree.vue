<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  activeTopics: {
    type: Object,
    default: () => ({})
  }
});

const dialog = ref(false);
const selectedTopic = ref(null);

const items = computed(() => {
  const root = {
    id: 'root',
    name: 'factory',
    children: []
  };

  Object.entries(props.activeTopics).forEach(([path, count]) => {
    const parts = path.split('/');
    let current = root;

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      let found = current.children.find(node => node.name === part);

      if (!found) {
        found = {
          id: parts.slice(0, i + 1).join('/'),
          name: part,
          children: [],
          count: i === parts.length - 1 ? count : 0
        };
        current.children.push(found);
      }
      current = found;
    }
  });

  return [root];
});
</script>

<template>
  <v-card>
    <v-card-text>
      <v-treeview
        v-model:active="selectedTopic"
        :items="items"
        item-title="name"
        item-children="children"
        return-object
        activatable
        open-all
      >
        <template v-slot:prepend="{ item }">
          <v-icon :color="item.children.length ? 'orange' : 'primary'">
            {{ item.children.length ? 'mdi-folder' : 'mdi-file' }}
          </v-icon>
        </template>
        
        <template v-slot:append="{ item }">
          <v-chip
            v-if="item.count"
            size="x-small"
            color="primary"
            class="ml-2"
          >
            {{ item.count }}
          </v-chip>
        </template>
      </v-treeview>
    </v-card-text>
  </v-card>
</template>