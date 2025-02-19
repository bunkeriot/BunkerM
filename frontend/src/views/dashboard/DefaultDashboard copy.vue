<script setup lang="ts">
import WidgetFive from './components/WidgetFive.vue';
import UniqueVisitor from './components/UniqueVisitor.vue';
import IncomeOverview from './components/IncomeOverview.vue';
import RecentOrder from './components/RecentOrder.vue';
import AnalyticsReport from './components/AnalyticsReport.vue';
import HelpSupport from './components/HelpSupport.vue';
import TransactionHistory from './components/TransactionHistory.vue';
import SalesReport from './components/SalesReport.vue';
</script>
<template>
  <!-- -------------------------------------------------------------------- -->
  <!-- Total widgets -->
  <!-- -------------------------------------------------------------------- -->
  <WidgetFive />

  <v-row class="mb-0">
    <!-- -------------------------------------------------------------------- -->
    <!-- Unique visitor -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="8">
      <UniqueVisitor />
    </v-col>

    <!-- -------------------------------------------------------------------- -->
    <!-- Income overview -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="4">
      <IncomeOverview />
    </v-col>
  </v-row>
  <v-row class="mb-0">
    <!-- -------------------------------------------------------------------- -->
    <!-- Recent order -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="8">
      <RecentOrder />
    </v-col>

    <!-- -------------------------------------------------------------------- -->
    <!-- Analytics Report -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="4">
      <AnalyticsReport />
    </v-col>
  </v-row>
  <v-row>
    <!-- -------------------------------------------------------------------- -->
    <!-- Sales Report -->
    <!-- -------------------------------------------------------------------- -->
    <v-col cols="12" md="7">
      <SalesReport />
    </v-col>

    <v-col cols="12" md="5">
      <v-row>
        <!-- -------------------------------------------------------------------- -->
        <!-- Transaction History -->
        <!-- -------------------------------------------------------------------- -->
        <v-col cols="12">
          <TransactionHistory />
        </v-col>

        <!-- -------------------------------------------------------------------- -->
        <!-- Help support -->
        <!-- -------------------------------------------------------------------- -->
        <v-col cols="12">
          <HelpSupport />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
