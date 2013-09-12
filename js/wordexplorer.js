'use strict';

$(document).ready(function () {

//    $(".steno-key").click(function (something) {
//        alert('here: ' + something);
//    });


});

// Declare app level module which depends on filters, and services
angular.module('ploverdojo', ['ploverdojo.controllers', 'ploverdojo.services', 'ploverdojo.directives', 'ngCookies'])
    .config(function ($interpolateProvider) {
        $interpolateProvider.startSymbol('//');
        $interpolateProvider.endSymbol('//');
    });

angular.module('ploverdojo.directives', [])
    .directive('stenokey', function () {
        return {
            restrict: 'E',
            scope: {}, // do not share scope with other stenokey objects
            template: '<a href="" ><div class="// class //" id="// id //" ng-transclude></div></a>',
            controller: function ($scope) {

            },
            link: function (scope, element, attrs) {
                element.addClass(attrs[key]);
            }
        };
    })
;

angular.module('ploverdojo.controllers', ['ploverdojo.wordexplorer', 'ploverdojo.lessonbrowser']);


/* Controllers */

angular.module('ploverdojo.wordexplorer', ['ploverdojo.services', 'ngCookies'])
    .controller('WordExplorerCtrl', ['$scope', '$cookies', 'WordService', 'ControllerSyncService', 'StenoService', 'UserDataService',
        function (sc, cookies, wordService, controllerSyncService, stenoService, userDataService) {

            var KeyStateEnum = {
                None: 0,
                Include: 1,
                Required: 2
            };

            var KeyStateLookup = {
                0: 'None',
                1: 'Include',
                2: 'Required'
            };


            sc.wordFilter = {}; // the object representing the filter for the dictionary

            var filter = {};

            sc.words = []; //  {'word': 'my word', 'stroke': 'STROKE', 'mastery': 0}
            sc.busy = false;

            var queryString = function () {

                var queryString = '';
                if (filter.include) {

                    queryString = 'keys=' + filter.include;

                    if (filter.require !== '') {
                        queryString += '&require=' + filter.require;
                    }
                }
                return queryString;
            };

            sc.runQuery = function () {

                sc.words = [];

                wordService.populateWordsFromFilter(queryString(), sc);
            };

            sc.buildParamStrings = function () {
                filter.include = '';
                filter.require = '';

                var includeParamStringShouldPrepend = true;
                var requiredParamStringShouldPrepend = true;


                var testExistenceInFilter = function (key, code, isLeftHand) {
                    if (sc.wordFilter.hasOwnProperty(key)) {
                        if (sc.wordFilter[key] === KeyStateEnum.Include) {
                            filter.include += code;

                            if (isLeftHand) {
                                includeParamStringShouldPrepend = false;
                            }
                        }
                        else if (sc.wordFilter[key] === KeyStateEnum.Required) {
                            filter.include += code;
                            filter.require += code;

                            if (isLeftHand) {
                                requiredParamStringShouldPrepend = false;
                            }
                        }
                    }
                };

                // build parameter string

                testExistenceInFilter('S-', 'S', true);
                testExistenceInFilter('T-', 'T', true);
                testExistenceInFilter('K-', 'K', true);
                testExistenceInFilter('P-', 'P', true);
                testExistenceInFilter('W-', 'W', true);
                testExistenceInFilter('H-', 'H', true);
                testExistenceInFilter('R-', 'R', true);
                testExistenceInFilter('A-', 'A', true);
                testExistenceInFilter('O-', 'O', true);
                testExistenceInFilter('*', '*', true);
                testExistenceInFilter('-E', 'E', true);
                testExistenceInFilter('-U', 'U', true);

                testExistenceInFilter('-F', 'F', false);
                testExistenceInFilter('-R', 'R', false);
                testExistenceInFilter('-P', 'P', false);
                testExistenceInFilter('-B', 'B', false);
                testExistenceInFilter('-L', 'L', false);
                testExistenceInFilter('-G', 'G', false);
                testExistenceInFilter('-T', 'T', false);
                testExistenceInFilter('-S', 'S', false);
                testExistenceInFilter('-D', 'D', false);
                testExistenceInFilter('-Z', 'Z', false);

                if (includeParamStringShouldPrepend && filter.include !== '') {
                    filter.include = '-' + filter.include;
                }

                if (requiredParamStringShouldPrepend && filter.require !== '') {
                    filter.require = '-' + filter.require;
                }
            };

            sc.$on('updateFilter', function () {
                filter = controllerSyncService.currentFilter;

                // update UI keyboard
                sc.wordFilter = [];
                var keys = [];
                keys = stenoService.expandBrief(filter.include);
                for (var i = 0; i < keys.length; i++) {
                    sc.wordFilter[keys[i]] = KeyStateEnum.Include;

                }

                keys = stenoService.expandBrief(filter.require);
                for (var j = 0; j < keys.length; j++) {
                    sc.wordFilter[keys[j]] = KeyStateEnum.Required;
                }

                sc.runQuery();
            });

            sc.customMode = true;
            sc.asterisk = false;

            sc.$on('updateCustomMode', function () {
                sc.customMode = controllerSyncService.customMode;
            });

            sc.toggle = function (code) {

                if (!sc.customMode) {
                    return;
                }

                if (sc.wordFilter.hasOwnProperty(code)) {
                    switch (sc.wordFilter[code]) {
                        case KeyStateEnum.None:
                            sc.wordFilter[code] = KeyStateEnum.Include;
                            break;
                        case KeyStateEnum.Include:
                            sc.wordFilter[code] = KeyStateEnum.Required;
                            break;
                        default:
                            sc.wordFilter[code] = KeyStateEnum.None;
                    }

                }
                else {
                    sc.wordFilter[code] = KeyStateEnum.Include;
                }


                sc.buildParamStrings();
            };

            sc.clear = function (codes) {
                for (var i = 0; i < codes.length; i++) {
                    sc.wordFilter[codes[i]] = KeyStateEnum.None;
                }
                sc.buildParamStrings();
            };

            sc.include = function (codes) {
                for (var i = 0; i < codes.length; i++) {
                    sc.wordFilter[codes[i]] = KeyStateEnum.Include;
                }
                sc.buildParamStrings();
            };

            sc.require = function (codes) {
                for (var i = 0; i < codes.length; i++) {
                    sc.wordFilter[codes[i]] = KeyStateEnum.Required;
                }
                sc.buildParamStrings();
            };

            sc.title = function (code) {
                if (sc.wordFilter.hasOwnProperty(code)) {
                    return KeyStateLookup[sc.wordFilter[code]];
                }
                else {
                    return KeyStateLookup[0];
                }
            };

            sc.class = function (code) {
                if (sc.wordFilter.hasOwnProperty(code)) {
                    return sc.wordFilter[code];
                }
                else {
                    return KeyStateEnum.None;
                }
            };

            sc.practice = function () {

                // which words will be the ones that get sent? Well, let's favored the ones that have not been mastered
                // we'll also favor the ones with higher frequency ranking

                var testdata = [];
                var masteredTestData = [];

                // convert to testdata format
                for (var w in sc.words) {
                    var thisWord = sc.words[w];

                    var d = [];
                    d[0] = thisWord.word;
                    d[1] = thisWord.stroke;
                    d[2] = thisWord.ranking;


                    if (thisWord.mastery === 100) {
                        masteredTestData.push(d);
                    }
                    else {
                        testdata.push(d);
                    }

                }

                var sortFn = function (a, b) {
                    return a[2] - b[2];
                };

                testdata.sort(sortFn);
                masteredTestData.sort(sortFn);

                var limit = 10;

                while (testdata.length < limit && masteredTestData.length > 0) {
                    var mastered = masteredTestData.pop();
                    if (mastered) {
                        testdata.push(mastered);
                    }
                }

                cookies.testdata = JSON.stringify(testdata.splice(0, limit));
                cookies.quiz_mode = 'WORD';

                userDataService.updateFilterHistory(filter);

                window.location.href = '/quiz?mode=word';
            };

        }
    ])
;




