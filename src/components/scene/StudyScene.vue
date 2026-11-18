<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
const motors = [
  [-1.3, 0, -1.3],
  [1.3, 0, -1.3],
  [-1.3, 0, 1.3],
  [1.3, 0, 1.3],
] as const;
</script>
<template>
  <TresCanvas
    :clear-alpha="0"
    :dpr="1"
    render-mode="on-demand"
    aria-hidden="true"
    ><TresPerspectiveCamera
      :position="[5, 5, 6]"
      :look-at="[0, 0, 0]" /><TresAmbientLight
      :intensity="1.5" /><TresDirectionalLight
      :position="[3, 5, 2]"
      :intensity="3" /><TresGroup :rotation="[0, 0.3, 0]"
      ><TresMesh
        ><TresBoxGeometry :args="[0.8, 0.25, 1.4]" /><TresMeshStandardMaterial
          color="#263b40"
          :roughness="0.55"
          :metalness="0.5" /></TresMesh
      ><TresMesh
        v-for="angle in [Math.PI / 4, -Math.PI / 4]"
        :key="angle"
        :rotation="[0, angle, 0]"
        ><TresBoxGeometry :args="[3.8, 0.12, 0.16]" /><TresMeshStandardMaterial
          color="#344e52" /></TresMesh
      ><TresGroup
        v-for="(position, index) in motors"
        :key="index"
        :position="[...position]"
        ><TresMesh
          ><TresCylinderGeometry
            :args="[0.2, 0.2, 0.25, 24]" /><TresMeshStandardMaterial
            color="#65e6b0"
            :metalness="0.6"
            :roughness="0.3" /></TresMesh
        ><TresMesh :position="[0, 0.2, 0]" :rotation="[-Math.PI / 2, 0, 0]"
          ><TresTorusGeometry
            :args="[0.65, 0.015, 8, 48]" /><TresMeshStandardMaterial
            color="#65e6b0" /></TresMesh></TresGroup></TresGroup
  ></TresCanvas>
</template>
