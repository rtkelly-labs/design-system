/**
 * Every example component, by its path under `src/examples/`.
 *
 * Page metadata names an example by path only; this map is the one place that
 * imports them, and only the component-page route imports this map. The root
 * layout reads page metadata for search and so never pulls example code into
 * every page's client bundle.
 */

import type { ComponentType } from 'react';

import BarChartBasic from './bar-chart/basic';
import BarChartHorizontal from './bar-chart/horizontal';
import BarChartInspect from './bar-chart/inspect';
import BarChartPerBarAccent from './bar-chart/per-bar-accent';
import BarChartResponsiveTabs from './bar-chart/responsive-tabs';
import ButtonAsLink from './button/as-link';
import ButtonBracketed from './button/bracketed';
import ButtonPending from './button/pending';
import ButtonSizes from './button/sizes';
import ButtonVariants from './button/variants';
import ButtonWithIcon from './button/with-icon';
import DataTableBasic from './data-table/basic';
import DataTableFiltering from './data-table/filtering';
import DataTablePagination from './data-table/pagination';
import DataTableRenderedCells from './data-table/rendered-cells';
import DataTableVirtualized from './data-table/virtualized';
import InputBasic from './input/basic';
import InputHelperAndError from './input/helper-and-error';
import InputSelectAndToggles from './input/select-and-toggles';
import InputTextarea from './input/textarea';
import InputValidatedForm from './input/validated-form';
import ModalAlertDialog from './modal/alert-dialog';
import ModalBasic from './modal/basic';
import ModalConfirm from './modal/confirm';
import ModalUnsavedInput from './modal/unsaved-input';

export const EXAMPLES: Record<string, ComponentType> = {
  'bar-chart/basic.tsx': BarChartBasic,
  'bar-chart/horizontal.tsx': BarChartHorizontal,
  'bar-chart/inspect.tsx': BarChartInspect,
  'bar-chart/per-bar-accent.tsx': BarChartPerBarAccent,
  'bar-chart/responsive-tabs.tsx': BarChartResponsiveTabs,
  'button/as-link.tsx': ButtonAsLink,
  'button/bracketed.tsx': ButtonBracketed,
  'button/pending.tsx': ButtonPending,
  'button/sizes.tsx': ButtonSizes,
  'button/variants.tsx': ButtonVariants,
  'button/with-icon.tsx': ButtonWithIcon,
  'data-table/basic.tsx': DataTableBasic,
  'data-table/filtering.tsx': DataTableFiltering,
  'data-table/pagination.tsx': DataTablePagination,
  'data-table/rendered-cells.tsx': DataTableRenderedCells,
  'data-table/virtualized.tsx': DataTableVirtualized,
  'input/basic.tsx': InputBasic,
  'input/helper-and-error.tsx': InputHelperAndError,
  'input/select-and-toggles.tsx': InputSelectAndToggles,
  'input/textarea.tsx': InputTextarea,
  'input/validated-form.tsx': InputValidatedForm,
  'modal/alert-dialog.tsx': ModalAlertDialog,
  'modal/basic.tsx': ModalBasic,
  'modal/confirm.tsx': ModalConfirm,
  'modal/unsaved-input.tsx': ModalUnsavedInput,
};
