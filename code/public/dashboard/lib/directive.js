var app = angular.module('Dashboard');
// in-page user view
app.directive("userView", function(){
  return {
    restrict: "A",
    scope: {
      userId: "=userId"
    },
    templateUrl: "partials/user.html",
    controller: UserController,
    link: function(scope, element, attrs) {
      scope.$watch("userId", function(val, old) {
        if (val != old) {
          scope.load(val);
        }
      });
    }
  };
});

// blink
app.directive("blink", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            if (scope.$eval(attrs.blink)) {
                $(element).addClass("animated pulse");
                scope.$eval(attrs.blink + "=false");
            }
        }
    };
});

// fade in when adding an item
app.directive("fadeIn", function() {
    return {
        restrict: "A",
        link: function(scope, element, attrs) {
            var object = scope.$eval(attrs.fadeIn);

            if (object) {
                $(element).css("opacity", 0);
                $(element).fadeTo(500, 1);
                scope.$eval(attrs.fadeIn + "=false");
            } else {
                $(element).show();
            }
        }
    };
});

app.directive("editField", function($http, $rootScope) {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      var editMode = false;
      var edit = null;
      var value = scope.$eval(attrs.editField);
      var copy = null;
      var isMobile = false; //$(window).width() < 900;
      
      var render = function(attrs, val) {
        // render the value
        var placeHolder = $("<span>");

        if (attrs.editType != "tags") {
          val = val != undefined ? val.toString() : "";
        }
        
        if (val == undefined || (val != undefined && val.length == 0)) {
          placeHolder.html(attrs.editPlaceholder || "None");
          placeHolder.addClass("label");
          $(element).attr("title", "Empty value. Click to edit.");
        } else {
          if (attrs.editType == "tags") {
            // render tags
            var placeHolder = $("<span>");
            $(element).disableSelection();
            
            for (var t = 0; t < val.length; ++t) {
              if (t > 0) placeHolder.append(" ");
              placeHolder.append($('<span class="label label-green text-overflow">').text(val[t]));
            }

            $(element).html(placeHolder);
          } else if (attrs.editType == "dropdown") {
            placeHolder.addClass("label").addClass("label-green").addClass("text-overflow");

            var values = scope.$eval(attrs.editValues);
            for (var v = 0; v < values.length; v++) {
              var id = "";

              if (attrs.dropdownId) {
                id = values[v][attrs.dropdownId];
              } else {
                id = values[v].value;
              }

              if (val == id) {
                val = values[v].name;
              }
            }
          } else {
            placeHolder.removeClass("label");
          }
        
          if (attrs.editType != "tags") {
            placeHolder.text(val);
          }

          $(element).attr("title", "Click to edit");
        }
        
        $(element).html(placeHolder);
      };
      
      render(attrs, value);
      
      // save call
      var save = function() {
        if (attrs.editSave) {
          var saveCall = attrs.editSave;

          if (attrs.editOriginal) {
            saveCall = saveCall.replace("$original", JSON.stringify(copy));
          }

          scope.$eval(saveCall);
        }
      };
      
      var switchToEdit = function() {
        // switch to edit mode
        if (editMode) {
          return;
        }
        
        var kids = $(element).children();
        value = scope.$eval(attrs.editField);

        if (attrs.editOriginal) {
          copy = angular.copy(scope.$eval(attrs.editOriginal));
        }

        if (attrs.editType == "dropdown") {
          // edit dropdown value
          var signatures;
          var dropdown = $('<select style="width: 100%; margin-bottom: 0;"></select>').insertAfter($(kids[0]));
          
          var values = scope.$eval(attrs.editValues);
          
          for (var v = 0; v < values.length; v++) {
            var option = $('<option></option>');
            var val = "";

            if (attrs.dropdownId) {
              val = values[v][attrs.dropdownId];
            } else {
              val = values[v].value;
            }

            option.attr("value", val);
            option.text(values[v].name);
            
            if (value == val) {
              option.attr("selected", "selected");
            }
            
            dropdown.append(option);
          }

          dropdown.focus();
          
          dropdown.blur(function() {
            $rootScope.popEsc();

            // save the value and switch back
            var text = $("option:selected", dropdown).html();
            var val = dropdown.val();
            
            if (val != value) {
              scope.$eval(attrs.editField + "=" + JSON.stringify(val));
              save();
            }
            
            $(kids[0]).show();
            editMode = false;
            dropdown.remove();
            
            scope.$apply();
          });

          $rootScope.onEsc(function() {
            dropdown.val(value);
            dropdown.blur();
          });
        } else if (attrs.editType == "number") {
          // edit number with spinner
          var textbox = $('<input class="input-xlarge" type="text" style="width: 95%; max-width: 300px; margin-bottom: 0;">').insertAfter($(kids[0]));
          textbox.val(value);
          textbox.focus();
  
          textbox.blur(function() {
            $rootScope.popEsc();

            if (textbox.val() != value) {
              // save the value and switch back
              scope.$eval(attrs.editField + "=" + JSON.stringify(textbox.val()))
              save();
            }
    
            $(kids[0]).show();
            editMode = false;
            textbox.remove();
    
            scope.$apply();
          });
      
          textbox.keypress(function (e) {
            if (e.which == 13) {
              $(this).blur();
              return false;
            }
          });

          $rootScope.onEsc(function() {
            textbox.val(value);
            textbox.blur();
          });
          
          textbox.forceNumeric();
        } else if (attrs.editType == "tags") {
          // edit tags
          var textbox = $('<input type="text">').insertAfter($(kids[0]));
          var value = scope.$eval(attrs.editField);
          
          textbox.val(value.join(","));
          textbox.tagsInput({ width: "auto", defaultText: attrs.editPlaceholder || "add a tag" });
          $(".tagsinput").css({ "height": "auto", "overflow": "auto", "overflow-y": "visible", "padding-bottom": "0" });
          
          var inputBox = $(".tagsinput").find("input").focus();
          inputBox.blur(function() {
            var that = this;
            
            setTimeout(function() {
              if ($(that).is(":focus") == false) {
                // save the value and switch back
                scope.$eval(attrs.editField + "=" + JSON.stringify(textbox.val().split(",")))
                save();
      
                $(kids[0]).show();
                editMode = false;
                textbox.remove();
        
                scope.$apply();
              }
            }, 100);
          });
        } else {
          // edit a textfield
          var textbox = $('<input class="input-xlarge" type="text" style="width: 95%; max-width: 300px; margin-bottom: 0;">').insertAfter($(kids[0]));
          textbox.val(value);
          textbox.focus();
  
          textbox.blur(function() {
            $rootScope.popEsc();

            if (textbox.val() !== (value||"")) {
              // save the value and switch back
              scope.$eval(attrs.editField + "=" + JSON.stringify(textbox.val()))
              save();
            }

            $(kids[0]).show();
            editMode = false;
            textbox.remove();
    
            scope.$apply();
          });
      
          textbox.keypress(function (e) {
            if (e.which == 13) {
              $(this).blur();
              return false;
            }
          });

          $rootScope.onEsc(function() {
            textbox.val(value);
            textbox.blur();
          });
        }

        $(kids[0]).hide();
        if (edit) {
          edit.remove();
        }
        
        editMode = true;
      };
      
      scope.$watch(attrs.editField, function(val) {
        // update DOM with the new value
        render(attrs, val);
      });
      
      $(element).click(switchToEdit);
    }
  };
});

//http://icelab.com.au/articles/levelling-up-with-angularjs-building-a-reusable-click-to-edit-directive/
app.directive("clickToEdit", function() {
    var editorTemplate = '<div class="click-to-edit">' +
        '<div ng-hide="view.editorEnabled">' +
            '{{value}} ' +
            '<a ng-click="enableEditor()">Edit</a>' +
        '</div>' +
        '<div ng-show="view.editorEnabled">' +
            '<input ng-model="view.editableValue">' +
            '<a href="#" ng-click="save()">Save</a>' +
            ' or ' +
            '<a ng-click="disableEditor()">cancel</a>.' +
        '</div>' +
    '</div>';

    return {
        restrict: "A",
        replace: true,
        template: editorTemplate,
        scope: {
            value: "=clickToEdit",
        },
        controller: function($scope) {
            $scope.view = {
                editableValue: $scope.value,
                editorEnabled: false
            };

            $scope.enableEditor = function() {
                $scope.view.editorEnabled = true;
                $scope.view.editableValue = $scope.value;
            };

            $scope.disableEditor = function() {
                $scope.view.editorEnabled = false;
            };

            $scope.save = function() {
                $scope.value = $scope.view.editableValue;
                $scope.disableEditor();
            };
        }
    };
});