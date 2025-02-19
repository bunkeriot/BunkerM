import { computed } from 'vue';
import * as themeColors from '@/theme/LightTheme';

const getPrimary = computed(() => {
  return themeColors.DefaultTheme.colors.primary;
});

const getdarkPrimary = computed(() => {
  return themeColors.DefaultTheme.colors.darkprimary;
});

const getLightBorder = computed(() => {
  return themeColors.DefaultTheme.colors.borderLight;
});

const getLightPrimary = computed(() => {
  return themeColors.DefaultTheme.colors.primary200;
});

const getSecondary = computed(() => {
  return themeColors.DefaultTheme.colors.secondary;
});
const getInfo = computed(() => {
  return themeColors.DefaultTheme.colors.info;
});

const getLightSecondary = computed(() => {
  return themeColors.DefaultTheme.colors.secondary200;
});

export { getPrimary,getInfo, getSecondary, getdarkPrimary, getLightPrimary, getLightSecondary, getLightBorder };
