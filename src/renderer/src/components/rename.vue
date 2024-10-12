<script setup>
import { ref } from 'vue'
const props = defineProps({
  title: String,
  icon: String,
  name: String,
  path: String
})

const emits = defineEmits(['close', 'ok'])
const open = ref(true)
const new_name = ref(props.name)
const onCancel = () => {
  open.value = false
  emits('close')
}

const onOk = () => {
  open.value = false

  emits('ok', {
    name: new_name.value,
    old_name: props.name,
    path: props.path
  })
}
</script>

<template>
  <div class="finder-rename">
    <a-modal
      v-model:open="open"
      :title="title"
      :centered="true"
      ok-text="确定"
      cancel-text="取消"
      :destroy-on-close="true"
      wrap-class-name="finder-rename-modal"
      @cancel="onCancel"
      @ok="onOk"
    >
      <img :src="icon" />
      <a-input v-model:value="new_name"></a-input>
    </a-modal>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.finder-rename {
  width: 100%;
  height: 100%;
}
</style>
<style lang="scss">
.finder-rename-modal {
  .ant-modal-body {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    img {
      width: 120px;
      height: 120px;

      object-fit: contain;
    }
  }
}
</style>
