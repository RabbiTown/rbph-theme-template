<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { RbtJudgeAction, RbtSyncMessageType, RbtTeamPuzzleState, type JudgeResponse, type PuzzleThemeContext, type SyncCurrencyPenalty } from '../.rbph/context';

const props = defineProps<{ rbph: PuzzleThemeContext }>();
const puzzle = props.rbph.state.puzzle;

const okSubmissionsComp = ref<{ updateData(newId?: number): void }>();
const submitResultComp = ref<{
  updateSuccess(result: JudgeResponse['result'], answer: string, currencyPenalty?: SyncCurrencyPenalty[]): void;
  updateFail(reason: string, answer: string): void;
}>();
const currencies = computed(() => Object.fromEntries(props.rbph.state.currencies.value.map(currency => [currency.id, currency])));
const unmetSubmitRequirements = computed(() => puzzle.value.data.submit_requirements.filter(requirement => (currencies.value[requirement.currency_id]?.amount ?? 0) < requirement.minimum));
const submitRequirementHint = computed(() => {
  if (!unmetSubmitRequirements.value.length) return undefined;
  const requirements = unmetSubmitRequirements.value.map(requirement => {
    const current = currencies.value[requirement.currency_id]?.amount ?? 0;
    return `${requirement.currency_name} ${props.rbph.utils.intPrecString(current, requirement.currency_prec)} / ${props.rbph.utils.intPrecString(requirement.minimum, requirement.currency_prec)}`;
  });
  return props.rbph.i18n.t('puzzleSubmit.requirements', { requirements });
});

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
  if (!props.rbph.sync.isSelfEcho(data.sid) && data.puzzle.id === puzzle.value.data.id && data.action > 0) {
    void okSubmissionsComp.value?.updateData();
  }
});
onBeforeUnmount(stopPuzzleSubmitted);
</script>

<template>
  <div>
    <RbtAnnouncements v-if="puzzle.data.announcements.length > 0" class="mb-4" :data="puzzle.data.announcements" :current-puzzle-id="puzzle.data.id" />
    <UCard variant="soft" :ui="{ body: 'py-4' }">
      <RbtContentBlocks :blocks="rbph.content.blocks" />
    </UCard>

    <template v-if="puzzle.data.submission_enabled">
      <USeparator class="mt-6" :ui="{ container: 'w-full', border: 'md:w-3/12 w-0' }">
        <RbtSubmitter
          class="w-full"
          :success="puzzle.state.state === RbtTeamPuzzleState.Solved"
          :cooldown-till="puzzle.state.cooldown_till"
          :max-submit="puzzle.state.max_submit"
          :submit-count="puzzle.state.submit_count"
          :externally-blocked="unmetSubmitRequirements.length > 0"
          :blocked-hint="submitRequirementHint"
          @submit-success="onSelfSubmitSuccess"
          @submit-fail="onSelfSubmitFailed"
        />
      </USeparator>
      <RbtSubmitResult ref="submit-result" class="mt-6" />

      <div class="w-full" variant="soft">
        <div class="text-lg font-bold mb-4 mt-6">{{ rbph.i18n.t('pages.puzzlePage.recentSuccessfulSubmissions') }}</div>
        <RbtSubmissions ref="ok-submissions" :puzzle-id="puzzle.data.id" :only-ok="true" />
        <div class="flex justify-center mt-2">
          <UButton :to="rbph.routes.submissions?.()" class="cursor-pointer" variant="ghost" color="secondary" icon="material-symbols:more-horiz" trailing-icon="material-symbols:more-horiz">{{ rbph.i18n.t('pages.puzzlePage.viewAllSubmissions') }}</UButton>
        </div>
      </div>
    </template>
  </div>
</template>
