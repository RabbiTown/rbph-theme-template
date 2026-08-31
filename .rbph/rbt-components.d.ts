// RBPH template infrastructure. Theme developers should not modify this file.

import type { DefineComponent } from 'vue';

type PublicComponent = DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
type NuxtUiComponentName =
  | 'UAccordion'
  | 'UAlert'
  | 'UApp'
  | 'UAvatar'
  | 'UAvatarGroup'
  | 'UBadge'
  | 'UBanner'
  | 'UButton'
  | 'UCalendar'
  | 'UCard'
  | 'UCarousel'
  | 'UCheckbox'
  | 'UCheckboxGroup'
  | 'UChip'
  | 'UCollapsible'
  | 'UColorPicker'
  | 'UContainer'
  | 'UEmpty'
  | 'UFieldGroup'
  | 'UForm'
  | 'UFormField'
  | 'UIcon'
  | 'UInput'
  | 'UInputDate'
  | 'UInputMenu'
  | 'UInputNumber'
  | 'UInputTags'
  | 'UInputTime'
  | 'UKbd'
  | 'UListbox'
  | 'UMarquee'
  | 'UPageBody'
  | 'UPageCard'
  | 'UPageColumns'
  | 'UPageFeature'
  | 'UPageGrid'
  | 'UPageHeader'
  | 'UPageHero'
  | 'UPageList'
  | 'UPageSection'
  | 'UPagination'
  | 'UPinInput'
  | 'UProgress'
  | 'URadioGroup'
  | 'UScrollArea'
  | 'USelect'
  | 'USelectMenu'
  | 'USeparator'
  | 'USkeleton'
  | 'USlider'
  | 'UStepper'
  | 'USwitch'
  | 'UTable'
  | 'UTabs'
  | 'UTextarea'
  | 'UTimeline'
  | 'UTree'
  | 'UUser';
type NuxtUiComponents = Record<NuxtUiComponentName, PublicComponent>;

declare module 'vue' {
  export interface GlobalComponents extends NuxtUiComponents {
    RbtAnnouncements: PublicComponent;
    RbtContent: PublicComponent;
    RbtContentBlocks: PublicComponent;
    RbtCurrencyBadges: PublicComponent;
    RbtLink: PublicComponent;
    RbtModal: PublicComponent;
    RbtPuzzleCard: PublicComponent;
    RbtSubmitResult: PublicComponent;
    RbtSubmissions: PublicComponent;
    RbtSubmitter: PublicComponent;
  }
}

export {};
