<script setup lang="ts">
defineProps<{ label: string }>();
</script>
<template>
  <svg
    viewBox="0 0 800 480"
    role="img"
    :aria-label="label"
    class="text-accent h-full w-full"
  >
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path
          d="M40 0H0V40"
          fill="none"
          stroke="currentColor"
          stroke-opacity=".09"
        />
      </pattern>
    </defs>
    <rect width="800" height="480" fill="url(#grid)" />
    <g fill="none" stroke="currentColor">
      <ellipse cx="400" cy="270" rx="275" ry="150" stroke-opacity=".12" />
      <path
        d="M100 240h600M400 45v390"
        stroke-dasharray="3 9"
        stroke-opacity=".3"
      />
      <path
        d="m235 125 330 220m0-220L235 345"
        stroke-width="18"
        stroke-opacity=".2"
      />
      <path d="m235 125 330 220m0-220L235 345" stroke-width="2" />
      <path
        d="m350 155 100 0 25 140-75 40-75-40Z"
        fill="var(--panel)"
        stroke-width="2"
      />
      <path d="M365 180h70v80h-70zM380 195h40v35h-40z" />
      <circle cx="400" cy="300" r="17" />
      <g
        v-for="point in [
          [235, 125],
          [565, 125],
          [235, 345],
          [565, 345],
        ]"
        :key="point.join()"
      >
        <ellipse
          :cx="point[0]"
          :cy="point[1]"
          rx="96"
          ry="51"
          stroke-opacity=".5"
        />
        <ellipse
          :cx="point[0]"
          :cy="point[1]"
          rx="77"
          ry="40"
          stroke-opacity=".15"
        />
        <circle :cx="point[0]" :cy="point[1]" r="9" />
      </g>
    </g>
    <g fill="currentColor" font-family="monospace" font-size="11" opacity=".65">
      <text x="40" y="40">QUAD / STUDY 01</text>
      <text x="635" y="440">TOP VIEW</text>
    </g>
  </svg>
</template>
