<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { RbtJudgeAction, RbtSyncMessageType, RbtTeamPuzzleState, type JudgeResponse, type RoundThemeContext, type SyncCurrencyPenalty } from '../.rbph/context';

const props = defineProps<{ rbph: RoundThemeContext }>();
const round = props.rbph.state.round;

const okSubmissionsComp = ref<{ updateData(newId?: number): void }>();
const submitResultComp = ref<{
  updateSuccess(result: JudgeResponse['result'], answer: string, currencyPenalty?: SyncCurrencyPenalty[]): void;
  updateFail(reason: string, answer: string): void;
}>();

function onSubmitSuccess(action: RbtJudgeAction) {
  if (action > 0) okSubmissionsComp.value?.updateData();
}

function onSelfSubmitSuccess(resp: unknown, answer: string) {
  const response = resp as JudgeResponse;
  onSubmitSuccess(response.result.action);
  submitResultComp.value?.updateSuccess(response.result, answer, response.currency_penalty);
}

function onSelfSubmitFailed(reason: string, answer: string) {
  submitResultComp.value?.updateFail(reason, answer);
}

const stopPuzzleSubmitted = props.rbph.sync.on(RbtSyncMessageType.PuzzleSubmitted, ({ data }) => {
  if (!props.rbph.sync.isSelfEcho(data.sid) && data.puzzle.id === round.value.data.puzzle && data.action > 0) {
    void okSubmissionsComp.value?.updateData();
  }
});
onBeforeUnmount(stopPuzzleSubmitted);
</script>

<template>
  <div>
    <div class="py-6">
      <span class="text-3xl font-bold">
        {{ round.data.title }}
      </span>
    </div>

    <UCard variant="soft" :ui="{ body: 'py4' }">
      <RbtContentBlocks :blocks="rbph.content.blocks" />

      <template v-if="round.state.puzzles.length > 0">
        <USeparator icon="material-symbols:extension-outline-rounded" class="mt-6 mb-2" />
        <div class="text-3xl font-bold text-center">{{ rbph.i18n.t('puzzle.puzzles') }}</div>
        <div class="flex justify-center gap-2 my-4 flex-wrap">
          <RbtPuzzleCard v-for="puzzle in round.state.puzzles" :key="puzzle.id" class="md:max-w-7/12 w-full" :puzzle="puzzle" />
        </div>
      </template>
    </UCard>

    <template v-if="round.data.puzzle && round.state.puzzle">
      <USeparator class="my-6" :ui="{ container: 'w-full', border: 'md:w-3/12 w-0' }">
        <RbtSubmitter
          class="w-full"
          :success="round.state.puzzle.state === RbtTeamPuzzleState.Solved"
          :cooldown-till="round.state.puzzle.cooldown_till"
          :max-submit="round.state.puzzle.max_submit"
          :submit-count="round.state.puzzle.submit_count"
          @submit-success="onSelfSubmitSuccess"
          @submit-fail="onSelfSubmitFailed"
        />
      </USeparator>
      <RbtSubmitResult ref="submit-result" />

      <div class="mt-6 w-full" variant="soft">
        <div class="text-lg font-bold mb-4">{{ rbph.i18n.t('puzzle.recentSuccessfulSubmissions') }}</div>
        <RbtSubmissions ref="ok-submissions" :puzzle-id="round.data.puzzle" :only-ok="true" />
      </div>
    </template>
  </div>
</template>
