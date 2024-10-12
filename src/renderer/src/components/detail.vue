<script setup>
import { ref } from 'vue'
defineProps({
  title: String,
  icon: String,
  name: String,
  path: String,
  file: Object
})

const emits = defineEmits(['close', 'ok'])
const open = ref(true)
const onCancel = () => {
  open.value = false
  emits('close')
}
</script>

<template>
  <div class="finder-de tail">
    <a-modal
      v-model:open="open"
      :title="title"
      :footer="null"
      :destroy-on-close="true"
      wrap-class-name="finder-detail-modal"
      :width="320"
      @cancel="onCancel"
    >
      <img :src="icon" />
      <div class="detail-info">
        <div class="info-item">
          <div class="info-label">名称</div>
          <div class="detail-name">{{ file.displayname }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">大小</div>
          <div class="detail-name">{{ Math.round(file.size / 1024) + 'kb' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">位置</div>
          <div class="detail-name">{{ file.filename }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">创建时间</div>
          <div class="detail-name">{{ file.createdate }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">修改时间</div>
          <div class="detail-name">{{ file.lastmodified }}</div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.finder-detail {
  width: 100%;
  height: 100%;
}
</style>
<style lang="scss">
.finder-detail-modal {
  .ant-modal-body {
    display: flex;
    align-items: center;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
    img {
      width: 120px;
      height: 120px;

      object-fit: contain;
    }
    .detail-info {
      display: flex;
      align-items: center;
      flex-direction: column;
      width: 100%;
      .info-item {
        display: flex;
        align-items: center;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
        margin-bottom: 8px;
        .info-label {
          width: 120px;
          color: #999;
          font-size: 14px;
        }
        .detail-name {
          font-size: 14px;
        }
      }
    }
  }
}
</style>
