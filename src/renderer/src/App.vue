<script setup lang="ts">
import { ref } from 'vue'
import Login from './components/login.vue'
import Finder from './components/finder.vue'
const loginState = ref(false)
</script>

<template>
  <div class="webdav_finder_container">
    <div v-if="!loginState" class="login_container">
      <div class="webdav_title">WebDav_Finder</div>
      <Login class="webdav_login" @login="(state) => (loginState = state)"></Login>
    </div>
    <div v-else class="finder_container">
      <Finder @close="() => (loginState = false)"></Finder>
    </div>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.webdav_finder_container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #ecefff;
  .login_container {
    .webdav_title {
      margin: 20px 0;
      text-align: center;
      font-size: 20px;
    }
    .webdav_login {
      position: relative;
      overflow: hidden;
      width: 300px;
      height: 280px;
      margin: auto;
      border-radius: 12px;
      background: transparent;
      background-color: #ffffff;
    }
  }
  .finder_container {
    overflow: hidden;
    width: 100%;
    height: 100%;
  }
}
</style>
