//= require jquery
//= require jquery_ujs
//= require turbolinks
//= require bootstrap
//= require bootstrap-sprockets
//= require_tree .

toastr.options.preventDuplicates = true;
toastr.options.positionClass='toast-top-center';
var appjs = angular.module('appjs', ['ngFileUpload']);

appjs.directive('showErrors', function() {
    return {
      restrict: 'A',
      require:  '^form',
      link: function (scope, el, attrs, formCtrl) {
        var inputEl   = el[0].querySelector("[name]");
        var inputNgEl = angular.element(inputEl);
        var inputName = inputNgEl.attr('name');
        inputNgEl.bind('blur', function() {
          el.toggleClass('has-error', formCtrl[inputName].$invalid);
        })
      }
    }
  });
appjs.controller('MainController', ['$compile', '$scope',
function($compile, $scope) {
	$scope.activateView = function(ele) {
		$compile(ele.contents())($scope);
		$scope.$apply();
	}
}]);


(function(){
	appjs.controller("ProjContro",['$http','$scope',
		function($http,$scope){
			$scope.list = [];
			$scope.tab = 1;
			$scope.projModal = null;
			Pusher.subscribe('items', 'updated', function (item) {
    		for (var i = 0; i < $scope.list.length; i++) {
    	  		if ($scope.list[i].nid === item.nid) {
		        	$scope.list[i] = item;
		        	break;
      			}
    			}
  			});
			$http.post('controllers/AuxProjects.php', {
				method : 'getProjects'
			}).success(function(data) {
				$scope.list = data.project;
			});
		}
	]);
})();

(function(){
	appjs.controller("MyUserControl",['$http','$scope',
	function($http,$scope){
		$scope.list = [];
		$http.post('controllers/AuxUser.php',{
			method:'findAll'
		}).success(function(data){
			$scope.list = data.users;
		});
	}
	]);
})();

(function() {
	appjs.controller("MyController", ['$http', '$scope',
	function($http, $scope) {
		$scope.name = "Algo";
		$scope.list = [];
		var scope = $scope;
		$http.post('controllers/AuxUser.php', {
			method : 'listGroups'
		}).success(function(data) {
			scope.list = data.groups;
		});
		scope.showAddUser = function(group){
			document.getElementById("groupnidg").value = group;
			document.getElementById("username").value = null;
			document.getElementById("usernidg").value = null;
			document.getElementById('canRead').checked = false;
			document.getElementById('canAutorize').checked = false;
			document.getElementById('canClose').checked = false;
			$('#formUserGroup').modal('show');
		}
		scope.buscar = function(){
			scope.list = [];
			$http.post('controllers/AuxUser.php', {
			method : 'findGroups',
			search : document.getElementById('searchGroups').value
			}).success(function(data) {
				scope.list = data.groups;
			});	
		}
		scope.delGroup = function(group,position){
			$http.post('controllers/AuxUser.php',{
				method:'delGroup',
				cdgroup:group
			}).success(function(data){
				if(data.status==-1){
					toastr.warning('El Grupo no se puede eliminar porque esta siendo usado por un Proyecto o Servicio');
				}else if(data.status==0){
					toastr.error('Error al eliminar el grupo, intente mas tarde');
				}else{
					toastr.success('Grupo Eliminado');
					team.loadGrid();
				}
			});
		}
		scope.delUseGroup = function(group,user){
			$http.post('controllers/AuxUser.php',{
				method:'delUseGroup',
				cdgroup:group,
				cduser:user
			}).success(function(data){
				if(data.status==1){
					toastr.success('Grupo Modificado');
					team.loadGrid();
				}else{
					toastr.error('No se pudo quitar al usuario del grupo');
				}
			});
		}
	}]);
})();


(function(){
	appjs.controller("MyTaskCon",['$http','$scope','Upload',
		function($http,$scope,Upload){
			$scope.list = [];
			$scope.tab = 1;
			$scope.taskModal = null;
			var scope = $scope;
			 $scope.$watch('file', function () {
		        if ($scope.file != null) {
		            $scope.upload([$scope.file]);
		        }
    		});
			$http.post('controllers/AuxTasks.php', {
				method : 'listTasks'
			}).success(function(data) {
				console.log(data);
				scope.list = data.tasks;
			});
			
			$scope.buscar = function(){
			  scope.list = [];
			  $http.post('controllers/AuxTasks.php', {
					method : 'listTasks',
					param : document.getElementById('searchServicio').value
				}).success(function(data) {
					scope.list = data.tasks;
				});
			}
			
			$scope.addComment = function(){
				$http.post('controllers/AuxUtils.php',{
					method:'addComment',
					cdtask:$scope.taskModal.nid,
					txtcomme:document.getElementsByTagName("textarea")[1].value
				}).success(function(data){
					/*console.log(data);
					if(data.status==1){*/
						toastr.success('Comentario agregado');
						document.getElementsByTagName("textarea")[1].value=null;
						$scope.showComments();
					//}
				});
			}
			
			$scope.taskDetail = function(task){
				task.comments = [];
				task.attachs = [];
				$scope.taskModal = task;
				$scope.showComments();
				$("#formdetailTask").modal('show');
			}
			
			$scope.showComments = function(){
				$scope.tab=1;
				$http.post('controllers/AuxUtils.php',{
					method:'getComments',
					cdtask:$scope.taskModal.nid
				}).success(function(data){
					$scope.taskModal.comments = data.comments;
				})
			}
			
			$scope.showAttachs = function(){
				$scope.tab=2;
				$http.post('controllers/AuxUtils.php',{
					method:'getAttachments',
					cdtask:$scope.taskModal.nid
				}).success(function(data){
					$scope.taskModal.attachs = data.attachments;
				})
			}
			
			$scope.upload = function(file){
				Upload.upload({
            			url: 'controllers/Upload.php',
            			fields: {'cdtask': $scope.taskModal.nid },
            			file: file
        				}).progress(function (evt) {
            				var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
        				}).success(function (data, status, headers, config) {
        					console.log(data);
        					if(data.status == 1){
        						toastr.success("Archivo creado correctamente");
        						$scope.showAttachs();
        					}else{
        						toastr.error("Error al subir el archivo, intenta más tarde");	
        					}
        				}).error(function (data, status, headers, config) {
            				toastr.error("Error al subir el archivo, intenta más tarde");
        				})
			}
			
			$scope.download = function(attachment){
				var v_data = {
					method:'downloadFile',
					filepath:attachment.fullpath,
					mimetype:attachment.mimetype
				};			
				$http({
					url:'controllers/AuxUtils.php',
					method:'POST',
					//responseType: 'arraybuffer',
					data:v_data,
					headers:{'Accept': attachment.mimetype}
				}).success(function(data){
					console.log(data);
					if(data.status==1){
						window.location='controllers/download.php?nid='+attachment.nid;
					}else{
						toastr.error(data.descr);		
					}
				});
			}
			$scope.loadGrid = function(){
				$.ajax({
					url : 'views/TasksGrid.php',
					type : 'GET',
					dataType : 'html'
				}).done(function(data) {
					$('#mainContent').html(data);
				});
			}
			$scope.authorize = function(task){
				$http.post('controllers/AuxTasks.php',{
					method:'authorizeTask',
					cdtask:task.nid
				}).success(function(data){
					toastr.success('Servicio Autorizado');
					$scope.loadGrid();
				});
			}
			
			$scope.close = function(task){
				$http.post('controllers/AuxTasks.php',{
					method:'closeTask',
					cdtask:task.nid
				}).success(function(data){
					toastr.success('Servicio Cerrado');
					$scope.loadGrid();
				});
			}
			
		}
		
		]);
})();

appjs.controller("modalController", function($scope, $http) {
	var form = this;
	form.data = {};
	$scope.processForm = function() {
		form.data["method"] = "addProject";
		form.data["cdgroup"] = document.getElementById('prjgroupnid').value;
		$http.post('controllers/AuxProjects.php', form.data).then(function(data) {
			if (data.data = 0) {
				toastr.error('Error al intentar guardar el proyecto');
			} else {
				toastr.success('Proyecto Guardado');
				$('#myModal').modal('hide');
				project.loadGrid();
				$scope.resetForm();
			}

		});

	};
	$scope.resetForm = function(){
		form.data = {};
	}
});
appjs.controller("tasksController", function($scope, $http) {
	var form = this;
	form.cdname="";
	form.data = {};
	form.types = {};
	form.submitted = false;
	$http.post('controllers/AuxTasks.php', {method:'getTypes'}).then(function(data) {
			form.types=data.data.types;
		});
	$scope.submitTask = function(formData) {
		form.submitted = true;
		if(formData.$invalid){
			return;
		}else{
			form.data["method"] = "addTask";
			form.data["cdgroup"] = document.getElementById('tskgroupnid').value;
			form.data["cdname"] = $scope.cdname;
			form.data["tasktype"] = $scope.tsktype;
			form.data["txtdescr"] = $scope.txtdescr;
			form.data["startdat"] = $scope.startdat;
			form.data["enddate"] = $scope.enddate;
			
			$http.post('controllers/AuxTasks.php', form.data).then(function(data) {
			if (data.data == 0) {
				toastr.error('Error al intentar guardar la tarea');
			} else {
				toastr.success('Servicio Guardado');
				form.data.$setPristine();
				$('#myModalT').modal('hide');
				task.loadGrid();	
			}
			});
		}
	};
});

appjs.controller("userController", function($scope, $http) {
	var form = this;
	form.data = {};
	$scope.submitUser = function() {
		form.data["method"] = "addUser";
		if(form.data["isadmin"]){
			form.data["isadmin"] = 1;
		}else{
			form.data["isadmin"] = 0;
		}
		$http.post('controllers/AuxUser.php', form.data).then(function(data) {
			console.log(data.data);
			if (data.data == 0) {
				toastr.error('Error al intentar guardar al usuario');
			} else {
				toastr.success('Usuario Guardado');
				$('#myModalU').modal('hide');
				//refreshPage or move into projects
			}

		});

	};
});

var team = {
	loadGrid : function() {
		$.ajax({
			url : 'views/TeamGrid.php',
			type : 'GET',
			dataType : 'html'
		}).done(function(data) {
			$('#mainContent').html(data);
		});
	},
	showForm : function() {
		$("#groupname").value = null;
		$('#formGroup').modal('show');
	},
	saveGroup : function() {
		var cdname = document.getElementById('groupname');
		if (cdname.value == null) {
			toastr.error('Debe de colocar un nombre de grupo');
		} else {
			$.ajax({
				url : 'controllers/AuxUser.php',
				type : 'POST',
				dataType : 'json',
				data : {
					method : 'addGroup',
					cdname : cdname.value
				},
				success : function(data) {
					if (data.status > 0) {
						$('#formGroup').modal('hide');
						toastr.success('Grupo Creado Correctamente', '', {
							closeEasing : 'swing',
							positionClass : 'toast-top-center',
							onHidden : function() {
								team.loadGrid();
							}
						});
					} else {
						toastr.error('No se pudo guardar el grupo');
					}
				}
			})

		}
	},
	saveUserGroup : function(){
		var v_canvalid = 0,v_canclose=0,v_readonly=0;
		if(document.getElementById('canAutorize').checked)
			v_canvalid=1;
		if(document.getElementById('canClose').checked)
			v_canclose=1;
		if(document.getElementById('canRead').checked)
			v_readonly=1;
		var v_data = {
			method:'saveUserGroup',
			user : document.getElementById('usernidg').value,
			group : document.getElementById('groupnidg').value,
			canvalid : v_canvalid,
			canclose : v_canclose,
			readonly : v_readonly
		};
		$.ajax({
			url:'controllers/AuxUser.php',
			type: 'POST',
			dataType:'json',
			data : v_data,
			success:function(data){
				if (data == 1) {
						$('#formUserGroup').modal('hide');
						toastr.success('Usuario agregado al grupo', '', {
							closeEasing : 'swing',
							positionClass : 'toast-top-center',
							onHidden : function() {
								team.loadGrid();
							}
						});
					} else {
						toastr.error('No se pudo guardar el usuario');
					}
			}
			
		});
	}
}

var users = {
	loadGrid : function(){
		$.ajax({
			url : 'views/UsersGrid.php',
			type : 'GET',
			dataType : 'html'
		}).done(function(data) {
			$('#mainContent').html(data);
		});
	}
}

var project = {
	create : function() {
		document.getElementById('project').value="";
		document.getElementById('projgroup').value="";
		document.getElementById('prjgroupnid').value="";
		document.getElementById('txtdescr').value="";
		document.getElementById('datebegi').value="";
		document.getElementById('dateend').value="";
		$('#myModal').modal('show');
	},
	showTask : function() {
		$('#myModalT').modal('show');
	},
	formUser : function() {
		$('#myModalU').modal('show');
	},
	loadGrid : function() {
		$.ajax({
			url : 'views/ProjectsGrid.php',
			type : 'GET',
			dataType : 'html'
		}).done(function(data) {
			$('#mainContent').html(data);
		});
	}
}

var task = {
	loadGrid : function() {
		$.ajax({
			url : 'views/TasksGrid.php',
			type : 'GET',
			dataType : 'html'
		}).done(function(data) {
			$('#mainContent').html(data);
		});
	}
}

function logout() {
	$.ajax({
		url : 'controllers/AuxLogin.php',
		type : 'POST',
		dataType : 'html',
		data : {
			method : 'logout'
		}
	}).done(function(data) {
		window.location = "login.php";
	});
}


$(document).ready(function() {
	
	task.loadGrid();
	$("#datebegi").datepicker({
		defaultDate : "+1d",
		dateFormat : "dd-mm-yy",
		onClose : function(selectedDate) {
			$("#dateend").datepicker("option", "minDate", selectedDate);
		}
	});
	$("#startdat").datepicker({
		defaultDate : "+1d",
		dateFormat : "dd-mm-yy",
		onClose : function(selectedDate) {
			$("#enddate").datepicker("option", "minDate", selectedDate);
		}
	});
	$("#dateend").datepicker({
		defaultDate : "+1d",
		dateFormat : "dd-mm-yy",
		onClose : function(selectedDate) {
			//$("#datebegi").datepicker("option", "maxDate", selectedDate);
		}
	});
	$("#enddate").datepicker({
		defaultDate : "+1d",
		dateFormat : "dd-mm-yy",
		onClose : function(selectedDate) {
			//$("#startdat").datepicker("option", "minDate", selectedDate);
		}
	});
	$("#taskgroup").autocomplete({
				source : function(req, res) {
					$.ajax({
						url : "controllers/AuxUser.php",
						type : 'POST',
						dataType : "json",
						data : {
							q : req.term,
							term : req.term,
							method : 'searchGroups',
							required:'readonly'
						},
						success : function(data) {
							res($.map(data.groups, function(item) {
								return {
									label : item.cdname,
									value : item.cdname,
									id : item.nid
								}
							}));
						}
					});
				},
				select : function(event, ui) {
					document.getElementById('tskgroupnid').value=ui.item.id;
					document.getElementById('taskgroup').value=ui.item.value;
					return false;
				}
			});
			
	$("#projgroup").autocomplete({
				source : function(req, res) {
					$.ajax({
						url : "controllers/AuxUser.php",
						type : 'POST',
						dataType : "json",
						data : {
							q : req.term,
							term : req.term,
							method : 'searchGroups'
						},
						success : function(data) {
							res($.map(data.groups, function(item) {
								return {
									label : item.cdname,
									value : item.cdname,
									id : item.nid
								}
							}));
						}
					});
				},
				select : function(event, ui) {
					document.getElementById('prjgroupnid').value=ui.item.id;
					document.getElementById('projgroup').value=ui.item.value;
					return false;
				}
			});

$("#username").autocomplete({
				source : function(req, res) {
					$.ajax({
						url : "controllers/AuxUser.php",
						type : 'POST',
						dataType : "json",
						data : {
							q : req.term,
							term : req.term,
							method : 'search'
						},
						success : function(data) {
							res($.map(data.users, function(item) {
								return {
									label : item.name + " - " + item.email,
									value : item.name,
									id : item.nid
								}
							}));
						}
					});
				},
				select : function(event, ui) {
					document.getElementById('usernidg').value=ui.item.id;
					document.getElementById('username').value=ui.item.value;
					return false;
				}
			});
	$("#cdrespon").autocomplete({
		minlegth : 3,
		appendTo : $("#cdrespon"),
		source : function(req, res) {
			$.ajax({
				url : 'controllers/AuxLogin.php?method=search',
				type : "POST",
				dataType : "json",
				data : {
					featureClass : "P",
					style : "full",
					maxRows : 10,
					term : req.term,
					method : 'search'
				},
				success : function(data) {
					res($.map(data.users, function(item) {
						return {
							label : item.name + " - " + item.email,
							value : item.nid
						}
					}));
				}
			});
		}
	});
	// Add body-small class if window less than 768px
	if ($(this).width() < 769) {
		$('body').addClass('body-small')
	} else {
		$('body').removeClass('body-small')
	}

	// MetsiMenu
	$('#side-menu').metisMenu();

	// Collapse ibox function
	$('.collapse-link').click(function() {
		var ibox = $(this).closest('div.ibox');
		var button = $(this).find('i');
		var content = ibox.find('div.ibox-content');
		content.slideToggle(200);
		button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
		ibox.toggleClass('').toggleClass('border-bottom');
		setTimeout(function() {
			ibox.resize();
			ibox.find('[id^=map-]').resize();
		}, 50);
	});

	// Close ibox function
	$('.close-link').click(function() {
		var content = $(this).closest('div.ibox');
		content.remove();
	});

	// Close menu in canvas mode
	$('.close-canvas-menu').click(function() {
		$("body").toggleClass("mini-navbar");
		SmoothlyMenu();
	});

	// Open close right sidebar
	$('.right-sidebar-toggle').click(function() {
		$('#right-sidebar').toggleClass('sidebar-open');
	});

	// Initialize slimscroll for right sidebar
	$('.sidebar-container').slimScroll({
		height : '100%',
		railOpacity : 0.4,
		wheelStep : 10
	});

	// Open close small chat
	$('.open-small-chat').click(function() {
		$(this).children().toggleClass('fa-comments').toggleClass('fa-remove');
		$('.small-chat-box').toggleClass('active');
	});

	// Initialize slimscroll for small chat
	$('.small-chat-box .content').slimScroll({
		height : '234px',
		railOpacity : 0.4
	});

	// Small todo handler
	$('.check-link').click(function() {
		var button = $(this).find('i');
		var label = $(this).next('span');
		button.toggleClass('fa-check-square').toggleClass('fa-square-o');
		label.toggleClass('todo-completed');
		return false;
	});

	// Append config box / Only for demo purpose
	// Uncomment on server mode to enable XHR calls

	// Minimalize menu
	$('.navbar-minimalize').click(function() {
		$("body").toggleClass("mini-navbar");
		SmoothlyMenu();

	});

	// Tooltips demo
	$('.tooltip-demo').tooltip({
		selector : "[data-toggle=tooltip]",
		container : "body"
	});

	// Move modal to body
	// Fix Bootstrap backdrop issu with animation.css
	$('.modal').appendTo("body");

	// Full height of sidebar
	function fix_height() {
		var heightWithoutNavbar = $("body > #wrapper").height() - 61;
		$(".sidebard-panel").css("min-height", heightWithoutNavbar + "px");

		var navbarHeigh = $('nav.navbar-default').height();
		var wrapperHeigh = $('#page-wrapper').height();

		if (navbarHeigh > wrapperHeigh) {
			$('#page-wrapper').css("min-height", navbarHeigh + "px");
		}

		if (navbarHeigh < wrapperHeigh) {
			$('#page-wrapper').css("min-height", $(window).height() + "px");
		}

		if ($('body').hasClass('fixed-nav')) {
			$('#page-wrapper').css("min-height", $(window).height() - 60 + "px");
		}

	}

	fix_height();

	// Fixed Sidebar
	$(window).bind("load", function() {
		if ($("body").hasClass('fixed-sidebar')) {
			$('.sidebar-collapse').slimScroll({
				height : '100%',
				railOpacity : 0.9
			});
		}
	});

	// Move right sidebar top after scroll
	$(window).scroll(function() {
		if ($(window).scrollTop() > 0 && !$('body').hasClass('fixed-nav')) {
			$('#right-sidebar').addClass('sidebar-top');
		} else {
			$('#right-sidebar').removeClass('sidebar-top');
		}
	});

	$(window).bind("load resize scroll", function() {
		if (!$("body").hasClass('body-small')) {
			fix_height();
		}
	});

	$("[data-toggle=popover]").popover();

	// Add slimscroll to element
	$('.full-height-scroll').slimscroll({
		height : '100%'
	})
});

// Minimalize menu when screen is less than 768px
$(window).bind("resize", function() {
	if ($(this).width() < 769) {
		$('body').addClass('body-small')
	} else {
		$('body').removeClass('body-small')
	}
});

// Local Storage functions
// Set proper body class and plugins based on user configuration
$(document).ready(function() {
	if (localStorageSupport) {

		var collapse = localStorage.getItem("collapse_menu");
		var fixedsidebar = localStorage.getItem("fixedsidebar");
		var fixednavbar = localStorage.getItem("fixednavbar");
		var boxedlayout = localStorage.getItem("boxedlayout");
		var fixedfooter = localStorage.getItem("fixedfooter");

		var body = $('body');

		if (fixedsidebar == 'on') {
			body.addClass('fixed-sidebar');
			$('.sidebar-collapse').slimScroll({
				height : '100%',
				railOpacity : 0.9
			});
		}

		if (collapse == 'on') {
			if (body.hasClass('fixed-sidebar')) {
				if (!body.hasClass('body-small')) {
					body.addClass('mini-navbar');
				}
			} else {
				if (!body.hasClass('body-small')) {
					body.addClass('mini-navbar');
				}

			}
		}

		if (fixednavbar == 'on') {
			$(".navbar-static-top").removeClass('navbar-static-top').addClass('navbar-fixed-top');
			body.addClass('fixed-nav');
		}

		if (boxedlayout == 'on') {
			body.addClass('boxed-layout');
		}

		if (fixedfooter == 'on') {
			$(".footer").addClass('fixed');
		}
	}
});

// check if browser support HTML5 local storage
function localStorageSupport() {
	return (('localStorage' in window) && window['localStorage'] !== null)
}

// For demo purpose - animation css script
function animationHover(element, animation) {
	element = $(element);
	element.hover(function() {
		element.addClass('animated ' + animation);
	}, function() {
		//wait for animation to finish before removing classes
		window.setTimeout(function() {
			element.removeClass('animated ' + animation);
		}, 2000);
	});
}

function SmoothlyMenu() {
	if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
		// Hide menu in order to smoothly turn on when maximize menu
		$('#side-menu').hide();
		// For smoothly turn on menu
		setTimeout(function() {
			$('#side-menu').fadeIn(500);
		}, 100);
	} else if ($('body').hasClass('fixed-sidebar')) {
		$('#side-menu').hide();
		setTimeout(function() {
			$('#side-menu').fadeIn(500);
		}, 300);
	} else {
		// Remove all inline style from jquery fadeIn function to reset menu state
		$('#side-menu').removeAttr('style');
	}
}

// Dragable panels
function WinMove() {
	var element = "[class*=col]";
	var handle = ".ibox-title";
	var connect = "[class*=col]";
	$(element).sortable({
		handle : handle,
		connectWith : connect,
		tolerance : 'pointer',
		forcePlaceholderSize : true,
		opacity : 0.8
	}).disableSelection();
}

