/* # Copyright (c) 2025 BunkerM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# You may not use this file except in compliance with the License.
# http://www.apache.org/licenses/LICENSE-2.0
# Distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
# */
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