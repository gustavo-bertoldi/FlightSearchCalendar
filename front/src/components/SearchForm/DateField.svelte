<script lang="ts">
  import type { InputRule } from "$types/autocomplete";
  import { CONSTANTS } from "$stores/constants";
  import { Col, TextField } from "svelte-materialify";
  import { createEventDispatcher } from "svelte";

  export let cols: number | undefined = undefined;
  export let sm: number | undefined = undefined;
  export let md: number | undefined = undefined;
  export let lg: number | undefined = undefined;
  export let xl: number | undefined = undefined;
  export let value: string = '';
  export let min: string = '1900-01-01';
  export let rules: InputRule[] = [];

  $: constants = $CONSTANTS;
  let dispatcher = createEventDispatcher();
</script>

<Col cols={cols} sm={sm} md={md} lg={lg} xl={xl}>
  <TextField
		color={constants.AMADEUS_BLUE}
		type="date"
		min={min}
    rules={rules}	
		bind:value={value}
    on:change={() => dispatcher('change')}>
    <slot/>
  </TextField>
</Col>
