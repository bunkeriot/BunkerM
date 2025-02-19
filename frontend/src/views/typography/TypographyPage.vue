<script setup lang="ts">
import { ref } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';

// component content
const page = ref({ title: 'Typography' });
const breadcrumbs = ref([
  {
    title: 'Typography',
    disabled: true,
    href: '#'
  }
]);
</script>

<template>
  <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
  <v-row>
    <v-col cols="12" md="6">
      <v-row>
        <v-col cols="12">
          <UiParentCard title="Basic">
            <h1 class="text-h1 mb-1">Inter</h1>
            <h5 class="text-h5">Font Family</h5>
            <v-breadcrumbs :items="['Regular', 'Medium', 'Bold']" class="text-h6 text-lightText mb-0 pa-0"></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Heading">
            <h1 class="text-h1 mb-2">H1 Heading</h1>
            <v-breadcrumbs :items="['Size: 38px', 'Weight: Bold', 'Line Height: 46px']" class="text-h6 text-lightText pa-0"></v-breadcrumbs>
            <v-divider></v-divider>
            <h2 class="text-h2 mb-2 mt-3">H2 Heading</h2>
            <v-breadcrumbs :items="['Size: 30px', 'Weight: Bold', 'Line Height: 38px']" class="text-h6 text-lightText pa-0"></v-breadcrumbs>
            <v-divider></v-divider>
            <h3 class="text-h3 mb-2 mt-3">H3 Heading</h3>
            <v-breadcrumbs
              :items="['Size: 24px', 'Weight: Regular & Bold', 'Line Height: 32px']"
              class="text-h6 text-lightText pa-0"
            ></v-breadcrumbs>
            <v-divider></v-divider>
            <h4 class="text-h4 mb-2 mt-3">H4 Heading</h4>
            <v-breadcrumbs :items="['Size: 20px', 'Weight: Bold', 'Line Height: 28px']" class="text-h6 text-lightText pa-0"></v-breadcrumbs>
            <v-divider></v-divider>
            <h5 class="text-h5 mb-2 mt-3">H5 Heading</h5>
            <v-breadcrumbs
              :items="['Size: 16px', 'Weight: Regular & Medium & Bold', 'Line Height: 24px']"
              class="text-h6 text-lightText pa-0"
            ></v-breadcrumbs>
            <v-divider></v-divider>
            <h6 class="text-h6 mb-2 mt-3">H6 Heading / Subheading</h6>
            <v-breadcrumbs
              :items="['Size: 14px', 'Weight: Regular', 'Line Height: 22px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Body 1">
            <p class="text-body-1">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 14px', 'Weight: Regular', 'Line Height: 22px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Body 2">
            <p class="text-body-2">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Subtitle 1">
            <p class="text-subtitle-1">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 14px', 'Weight: Medium', 'Line Height: 22px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Subtitle 2">
            <p class="text-subtitle-2">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Medium', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Caption">
            <p class="text-caption">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
      </v-row>
    </v-col>
    <v-col cols="12" md="6">
      <v-row>
        <v-col cols="12">
          <UiParentCard title="Alignment">
            <p class="text-left text-caption">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p class="text-center text-caption">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p class="text-right mb-0 text-caption">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Gutter Bottom">
            <p class="text-h6 mb-3">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p class="text-caption mb-3">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Overline">
            <div class="text-overline text-uppercase mb-3">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </div>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Link">
            <a href="/utils/typography" class="link-hover text-primary d-inline-block mb-3">mantisdashboard.io</a>
            <v-breadcrumbs
              :items="['Size: 12px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Colors">
            <h6 class="text-h6 text-primary">This is Primary text color.</h6>
            <h6 class="text-h6 text-secondary">This is Secondary text color.</h6>
            <h6 class="text-h6 text-success">This is Success text color.</h6>
            <h6 class="text-h6 text-warning">This is Warning text color.</h6>
            <h6 class="text-h6 text-error">This is Error text color.</h6>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Paragraph">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 14px', 'Weight: Regular', 'Line Height: 20px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
        <v-col cols="12">
          <UiParentCard title="Font style">
            <p class="font-italic">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p class="text-subtitle-1 font-italic">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <v-breadcrumbs
              :items="['Size: 14px', 'Weight: Italic Bold', 'Line Height: 22px']"
              class="text-h6 text-lightText mb-0 pa-0"
            ></v-breadcrumbs>
          </UiParentCard>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
