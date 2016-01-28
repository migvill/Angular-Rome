/*global angular */
angular.module('rome', [])
    .provider('romeDefaults', function romeDefaultsProvider() {
      return {
        options: {},
        $get: function() {
          return this.options;
        },
        set: function(obj) {
          this.options = obj;
        }
      }
    })
    .directive('rome', ['romeDefaults', '$interval', function romeDirective(romeDefaults, $interval) {
      'use strict';

      function stringToBool(str, fallback) {
        return (typeof str === 'string') ? str === 'true' : fallback;
      }

      /**
       * Validation
       * Pass rome-* a the ng-model of a rome element
       */
      function rangeValidation(attrs, config) {
        var romeValidator = attrs.romeBefore || attrs.romeBeforeEq || attrs.romeAfterEq || attrs.romeAfter;
        if (romeValidator) {
          var has_id = romeValidator.indexOf('#') === 0;
          var matched_element;
          var search_attr;
          var rome_elements = angular.element(document.getElementsByTagName('rome')).find('input');
          var search_element;
          if (has_id) {
            matched_element = angular.element(document.getElementById(romeValidator.substr(1)));
          } else {
            for (var i = 0; i < rome_elements.length; i++) {
              if (rome_elements[i].getAttribute('ng-model') == romeValidator) {
                matched_element = angular.element(rome_elements[i]);
                break;
              }
            }
          }

          if (matched_element) {
            if (attrs.romeBefore) {
              config.dateValidator = rome.val.before(matched_element[0]);
            } else if (attrs.romeBeforeEq) {
              config.dateValidator = rome.val.beforeEq(matched_element[0]);
            } else if (attrs.romeAfter) {
              config.dateValidator = rome.val.after(matched_element[0]);
            } else if (attrs.romeAfterEq) {
              config.dateValidator = rome.val.afterEq(matched_element[0]);
            }
          } else {
            throw new Error('Cannot find rome instance from that ng-model.');
          }
        } else {
          config.dateValidator = Function.prototype;
        }
      }

      return {
        restrict: 'AE',
        transclude: 'attributes',
        scope: {
          ngModel: '=',
          ngChange: '=?'
        },
        require: '^ngModel',
        template: '<div class="rome-container">' +
          '<input type="text" ng-transclude class="rome-input"></div>',
        link: function (scope, el, attrs) {
          var rome_instance;
          var input = el.find('input');

          /* Simple JS merge function */
          var _merge = function(obj, src) {
            for (var key in src) {
              if (src.hasOwnProperty(key) && src[key] !== undefined) {
                obj[key] = src[key];
              }
            }
            return obj;
          };

          /**
           * Rome Config
           *
           * Merges with romeDefaultsProvider value, which then merges with the rome default values.
           * Merge romeDefaults with an object to avoid romeDefaults being modified in the merge.
           */
          var temp_config = _merge({}, romeDefaults);

          /* convert strings to a boolean */
          if (typeof attrs.romeAutoClose === 'string' && attrs.romeAutoClose !== 'time') {
            attrs.romeAutoClose = attrs.romeAutoClose === 'true';
          }

          var config = _merge(temp_config, {
            appendTo: attrs.romeAppendTo,
            autoClose: attrs.romeAutoClose,
            autoHideOnBlur: stringToBool(attrs.romeAutoHideOnBlur, true),
            autoHideOnClick: stringToBool(attrs.romeAutoHideOnClick, true),
            date: stringToBool(attrs.romeDate, true),
            dayFormat: attrs.romeDayFormat,
            initialValue: attrs.romeInitialValue || moment().millisecond(0).second(0).minute(0).hour(0),
            inputFormat: attrs.romeInputFormat,
            max: attrs.romeMax,
            min: attrs.romeMin,
            monthFormat: attrs.romeMonthFormat,
            monthsInCalendar: attrs.romeMonthsInCalendar,
            required: stringToBool(attrs.romeRequired, false),
            time: stringToBool(attrs.romeTime, true),
            timeFormat: attrs.romeTimeFormat,
            timeInterval: attrs.romeTimeInterval,
            timeOnTop: stringToBool(attrs.romeTimeOnTop, false),
            weekdayFormat: attrs.romeWeekdayFormat,
            weekStart: attrs.romeWeekStart
          });

          /**
           * Initialize Rome with the merged config from above.
           */
          rome_instance = rome(input[0], config);

          // Hack to ensure all other rome directives are loaded so range validation will find a matching element.
          $interval(function () {
            rangeValidation(attrs, config);
          }, 100, 2);

          /**
           * Input Attributes
           * Hat tip to Ionic for this idea.
           */
          angular.forEach({
            'id': attrs.id,
            'name': attrs.name,
            'disabled': attrs.disabled,
            'readonly': attrs.readonly,
            'required': attrs.required,
            'novalidate': attrs.novalidate,
            'ng-value': attrs.ngValue,
            'ng-disabled': attrs.ngDisabled,
            'ng-change': attrs.ngChange,
            'ng-model': attrs.ngModel
          }, function (value, name) {
            if (angular.isDefined(value)) {
              el.removeAttr(name);
              input.attr(name, value);
            }
          });

          function formatDate() {
            scope.ngModel = rome_instance.getDateString();
            scope.formattedValue = rome_instance.getDateString(attrs.viewFormat || romeDefaults.viewFormat) || romeDefaults.labelValue;
          }

          rome_instance.on('ready', function() {
            scope.$apply(function () {
              rome_instance.setValue(scope.ngModel);
              formatDate();
            });
          });

          rome_instance.on('data', function (value) {
            scope.$apply(function () {
              scope.ngModel = value;
              formatDate();
            });
          });

          scope.$watch('ngModel', function(value) {
            if (value) {
              rome_instance.setValue(value);
              scope.formattedValue = rome_instance.getDateString(attrs.viewFormat || romeDefaults.viewFormat) || romeDefaults.labelValue;
            }
          }, true);
        }
      };
    }]);
