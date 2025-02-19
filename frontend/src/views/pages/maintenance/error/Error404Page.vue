<script setup lang="ts"></script>

<template>
  <v-row no-gutters class="overflow-hidden bg-containerBg" style="min-height: 100vh">
    <v-col class="d-flex align-center justify-center">
      <div class="text-center">
        <div class="CardMediaWrapper">
          <img src="@/assets/images/maintenance/Error404.png" alt="404" />
          <div class="CardMediaBuild">
            <img src="@/assets/images/maintenance/TwoCone.png" alt="grid" class="w-100" />
          </div>
        </div>
        <h1 class="text-h1 mt-16">Page Not Found</h1>
        <p class="text-h6 text-lightText">The page you are looking was moved, removed, <br />renamed, or might never exist!</p>
        <v-btn variant="flat" color="primary" class="mt-2" to="/dashboard"> Back To Home</v-btn>
      </div>
    </v-col>
  </v-row>
</template>
<style lang="scss">
.CardMediaWrapper {
  max-width: 720px;
  margin: 0 auto;
  position: relative;
  > img {
    @media (min-width: 0px) {
      width: 250px;
      height: 130px;
    }
    @media (min-width: 768px) {
      width: 590px;
      height: 300px;
    }
  }
}
.CardMediaBuild {
  position: absolute;
  top: 60px;
  @media (min-width: 0px) {
    width: 130px;
    height: 115px;
    right: -14%;
  }
  @media (min-width: 768px) {
    width: 390px;
    height: 330px;
    right: -60%;
  }
}
</style>
