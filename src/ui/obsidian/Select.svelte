<!-- Simple select component if not present in the codebase -->
<script lang="ts">
    export let options: string[] = [];
    export let value: string = "";
    export let placeholder: string = "";
    export let label: string = "";

    function handleChange(event: Event) {
        value = (event.target as HTMLSelectElement).value;
        // Dispatch change event for parent listeners
        dispatch("change", { value });
    }
    import { createEventDispatcher } from "svelte";
    const dispatch = createEventDispatcher();
</script>

<label style="display: flex; flex-direction: column;">
    {#if label}{label}{/if}
    <select bind:value on:change={handleChange}>
        {#if placeholder}
            <option value="">{placeholder}</option>
        {/if}
        {#each options as option (option)}
            <option value={option}>{option}</option>
        {/each}
    </select>
</label>

<style>
    select {
        padding: 0.3em 0.5em;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-primary-alt);
        font-size: 1em;
    }
</style>