// composables/useACLManagement.js
import { ref, computed } from 'vue';

export function useACLManagement() {
  const newACL = ref({
    topic: '',
    aclType: '',
    permission: ''
  });

  const aclTypes = [
    { text: 'Publish', value: 'publishClientSend' },
    { text: 'Subscribe', value: 'subscribeLiteral' }
  ];

  const permissions = [
    { text: 'Allow', value: 'allow' },
    { text: 'Deny', value: 'deny' }
  ];

  const isValidACL = computed(() => {
    return newACL.value.topic &&
      newACL.value.aclType &&
      newACL.value.permission;
  });

  function resetACLForm() {
    newACL.value = {
      topic: '',
      aclType: '',
      permission: ''
    };
  }

  return {
    newACL,
    aclTypes,
    permissions,
    isValidACL,
    resetACLForm
  };
}