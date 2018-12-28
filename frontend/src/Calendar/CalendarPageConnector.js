import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import moment from 'moment';
import { isCommandExecuting } from 'Utilities/Command';
import isBefore from 'Utilities/Date/isBefore';
import withCurrentPage from 'Components/withCurrentPage';
import { searchMissing, setCalendarDaysCount, setCalendarFilter } from 'Store/Actions/calendarActions';
import createSeriesCountSelector from 'Store/Selectors/createSeriesCountSelector';
import createUISettingsSelector from 'Store/Selectors/createUISettingsSelector';
import createCommandsSelector from 'Store/Selectors/createCommandsSelector';
import CalendarPage from './CalendarPage';

function createMissingEpisodeIdsSelector() {
  return createSelector(
    (state) => state.calendar.start,
    (state) => state.calendar.end,
    (state) => state.calendar.items,
    (state) => state.queue.details.items,
    (start, end, episodes, queueDetails) => {
      return episodes.reduce((acc, episode) => {
        const airDateUtc = episode.airDateUtc;

        if (
          !episode.episodeFileId &&
          moment(airDateUtc).isAfter(start) &&
          moment(airDateUtc).isBefore(end) &&
          isBefore(episode.airDateUtc) &&
          !queueDetails.some((details) => details.episode.id === episode.id)
        ) {
          acc.push(episode.id);
        }

        return acc;
      }, []);
    }
  );
}

function createIsSearchingSelector() {
  return createSelector(
    (state) => state.calendar.searchMissingCommandId,
    createCommandsSelector(),
    (searchMissingCommandId, commands) => {
      if (searchMissingCommandId == null) {
        return false;
      }

      return isCommandExecuting(commands.find((command) => {
        return command.id === searchMissingCommandId;
      }));
    }
  );
}

function createMapStateToProps() {
  return createSelector(
    (state) => state.calendar.selectedFilterKey,
    (state) => state.calendar.filters,
    createSeriesCountSelector(),
    createUISettingsSelector(),
    createMissingEpisodeIdsSelector(),
    createIsSearchingSelector(),
    (
      selectedFilterKey,
      filters,
      seriesCount,
      uiSettings,
      missingEpisodeIds,
      isSearchingForMissing
    ) => {
      return {
        selectedFilterKey,
        filters,
        colorImpairedMode: uiSettings.enableColorImpairedMode,
        hasSeries: !!seriesCount,
        missingEpisodeIds,
        isSearchingForMissing
      };
    }
  );
}

function createMapDispatchToProps(dispatch, props) {
  return {
    onSearchMissingPress(episodeIds) {
      dispatch(searchMissing({ episodeIds }));
    },

    onDaysCountChange(dayCount) {
      dispatch(setCalendarDaysCount({ dayCount }));
    },

    onFilterSelect(selectedFilterKey) {
      dispatch(setCalendarFilter({ selectedFilterKey }));
    }
  };
}

export default withCurrentPage(
  connect(createMapStateToProps, createMapDispatchToProps)(CalendarPage)
);
