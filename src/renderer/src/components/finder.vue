<script setup lang="ts">
import useWebDav from '../hooks/useWebDav'
defineProps({
  loginState: Boolean
})

const emits = defineEmits(['close'])

const { remotePaths } = useWebDav()

const close_webdav = () => {
  window.api.webdav.login_out()
  emits('close')
}
</script>

<template>
  <div class="webdav_finder">
    <div class="finder_header">
      <div class="search">
        <a-input-search placeholder="搜索当前目录" enter-button />
      </div>
      <div class="close-webdav">
        <a-button type="primary" danger @click="close_webdav">关闭连接</a-button>
      </div>
    </div>
    <div class="finder_content">
      <div class="finder_breadcrumb"></div>
      <div class="finder_toolbar"></div>
      <div class="finder_list"></div>
    </div>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.webdav_finder {
  width: 100%;
  height: 100%;
  padding: 10px;
  background-color: #ffffff;
  .finder_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 50px;
    margin: 0 10px;
    .search {
      display: flex;
      align-items: center;
      width: 300px;
      height: 50px;
    }
    .close-webdav {
      display: flex;
      align-items: center;
      height: 50px;
    }
  }
}
</style>
