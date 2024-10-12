<script setup>
defineProps({
  title: String,
  percent: Number
})
</script>

<template>
  <div class="finder-progress">
    <a-modal
      :open="true"
      :title="title.value"
      :footer="null"
      :closable="false"
      :centered="true"
      :destroy-on-close="true"
    >
      <a-progress :percent="percent.value" status="active" show-info />
    </a-modal>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.finder-progress {
  width: 100%;
  height: 100%;
}
</style>
