var touch = touch || {};

(function(obj) {

    //可以进行自定义配置的参数，也可以关闭特定手势的识别等
    var configuration = {
	    tap: true,
		doubleTap: true,
	    swipe: true,
		swipeDistance: 30,
		hold: true,
		holdTime: 1000,
		pinch: true,
		pinchDistance: 30,
		rotate: true
	};

    //定制的事件对象
    eventManage = (function() {
	     //customEventMap = { eid:{ type:{ handle:[[],[],  ...]},  ...},  ...};
		var customEventMap = {};
		return {
		    addEvent: function(element, type, handle) {
			    var eid = instanceManage.getEID(element);
			    customEventMap[eid] = customEventMap[eid] || {};
				customEventMap[eid][type] = customEventMap[eid][type] || {};
				customEventMap[eid][type]["handle"] = customEventMap[eid][type]["handle"] || [];
				typeof handle === "function" ? customEventMap[eid][type]["handle"].push(handle) : null;
			},
			removeEvent: function(element, type) {
			    var eid = instanceManage.getEID(element);
			    if(customEventMap[eid]) {
				    if(customEventMap[eid][type]) {
					    delete customEventMap[eid][type];
					};
				};
			},
			trigger: function(element, type) {
			    var i,
				    eid = instanceManage.getEID(element);
			    if(customEventMap[eid]) {
				    if(customEventMap[eid][type]) {
						for(i = 0; i < customEventMap[eid][type]["handle"].length; i = i + 1){
						    customEventMap[eid][type]["handle"][i].call(element);
						};
					};
				};
			}
		};
	})();
	
    //实例的管理
	instanceManage = (function() {
		var eventObject = {};
	    return {
			getEID: function(element) {
			    var id;
				id = element.getAttribute("data-eid");
				return id;
			},
			hasEventObject: function(element) {
			    var eid = instanceManage.getEID(element);
			    if(eventObject[eid]) {
				    return true;
				}else {
				    return false;
				};
			},
			getEventObject: function(element) {
			    var eid = instanceManage.getEID(element);
				return eventObject[eid];
			},
			setEventObject: function(element, obj) {
			    var eid = instanceManage.getEID(element);
			    if(obj === "undefined") {
				    delete eventObject[eid];
				}else {
			        eventObject[eid] = obj;
				};
			}
		};
	})();

    //监听管理
	listenManage = (function() {
	    return {
		    addListener: function(element, type, fn, capture) {
			    if(element.addEventListener) {
		            element.addEventListener(type, fn, !!capture);
		        }else if(element.attachEvent) {
		            element.attachEvent("on" + type, fn);
		        }else {
		            element["on" + type] = fn;
	 	        }
			},
			removeListener: function(element, type, fn, capture) {
			    if(element.removeEventListener) {
		            element.removeEventListener(type, fn, !!capture);
		        }else if(element.detachEvent) {
		            element.detachEvent("on" + type, fn);
		        }else {
		            element["on" + type] = null;
		        }
			}
		};
	})();
	
	gestureManage = (function() {
	
        //获取变化的角度
		var getAngle = function(p1, p2) {
	        return Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI * -1;
	    };

        //获取变化的距离
        var getDistance = function(coordinate) {
            var x1 = coordinate[0][0], 
		        x2 = coordinate[1][0], 
		        y1 = coordinate[0][1], 
		        y2 = coordinate[1][1];
            return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
        };
		
        //计算滑动方向
        var getDirection = function(prePos, nowPos) {
            var result = false,
	            angle = getAngle(prePos[0], nowPos[0]);
				
            if(angle >= -45 && angle < 45) {
	            return "右边";
	        }else if(angle >= 45 && angle < 135) {
		        return "上边";
	        }else if(angle >= 135 || angle < -135) {
		        return "左边";
	        }else if(angle >= -135 && angle < -45) {
		        return "下边";
	        };
        };
		
        //获取屏幕上接触点数量
		var getFingers = function(e) {
		    return e.touches ? e.touches.length : 1;
		};
		
        //计算旋转时的圆心
		var getRotateCenter = function(el, pos) {
		    var arr = [];
		
			if(pos[1]) {
				arr.push((pos[0][0] + pos[1][0]) / 2);
				arr.push((pos[0][1] + pos[1][1]) / 2);
			}else {
		        //单指的情况获取元素的中点
			    el = el.getBoundingClientRect();
			    arr.push(el.width/2);
				arr.push(el.height/2);
			}
			
			return arr;
		};
		
        //判断是否为触屏
		var isTouch = function() {
		    return ("ontouchstart" in window);
		};

        //获取接触点坐标
        var getPosition  = function(e) {
            var i,
	            arr = [];
			if(isTouch()) {
                for(i = 0; i < e.touches.length; i = i + 1) {
	                arr.push([
		                e.touches[i].pageX,
			            e.touches[i].pageY
		            ]);
		            i = i + 1;
	            };
			}else {
			    arr.push([
				    e.pageX,
					e.pageY
				]);
			};
	        return arr;
        };
		
		var preventDefault = function(e) {
            e.preventDefault();
            e.stopPropagation();
        };

        //以下几个用于用户自定义手势
        //该函数用于把后一点相对于前一点的角度转化为对应的方向维度
		var angleToNum = function(angle) {
	        if(angle >= -22.5 && angle < 22.5) {
		        return 1;
		    }else if(angle >= 22.5 && angle < 67.5) {
		        return 2;
		    }else if(angle >= 67.5 && angle < 112.5) {
		        return 3;
		    }else if(angle >= 112.5 && angle < 157.5) {
		        return 4;
		    }else if(angle >= 157.5 || angle < -157.5) {
		        return 5;
		    }else if(angle >= -157.5 && angle < -112.5) {
		        return 6; 
		    }else if(angle >= -112.5 && angle < -67.5) {
		        return 7;
		    }else if(angle >= -67.5 && angle < -22.5) {
		        return 8;
		    }
	    };
		
        //该函数汇总每个方向数字出现总数，再求所占百分比
		var average = function(arr) {
	        var j,
		        num = [0,0,0,0,0,0,0,0],
			    len = arr.length;
			 
            for(j = 0; j < len; j = j + 1) {
		        switch(arr[j]) {
			        case 1:
				        num[0] = num[0] + 1;
					    break;
			        case 2:
				        num[1] = num[1] + 1;
					    break;
				    case 3:
				        num[2] = num[2] + 1;
				 	    break;
				    case 4:
				        num[3] = num[3] + 1;
					    break;
				    case 5:
				        num[4] = num[4] + 1;
					    break;
				    case 6:
				        num[5] = num[5] + 1;
					    break;
				    case 7:
				        num[6] = num[6] + 1;
					    break;
				    case 8:
				        num[7] = num[7] + 1;
					    break;
			    };
		    };
		    for(j = 0; j < 8; j = j + 1) {
		        num[j] = num[j]/len;
		    };
		    return num;
	    };
		
        //该函数比较数据相似性，多维余弦相似性计算   
		var similarity = function(a, b) {
	        var i,
			    num1 = 0,
				num2 = 0,
				num3 = 0,
				result = 0;
		    for(i = 0; i < a.length; i = i + 1) {
			    num1 = num1 + a[i] * b[i];
				num2 = num2 + a[i] * a[i];
				num3 = num3 + b[i] * b[i];
			};
		    return result = num1/(Math.sqrt(num2)*Math.sqrt(num3));
	    };
		
		return function(element) {
		   //每个实例的私人变量和函数
		    var init = {},
			    clearID = {hold: null, tap: null},
				time = {start: null, leave: null},
				distance = {pre: null, now: null},
				touchPos = {pre: [], now: [], rotateCenter: [], preAngle: null, rotateDirection: 0, changeAngle: 0},
				//鼠标手势下，需要确保mousemove到元素上时已经按下了鼠标
				isTouchStart = false,
				//记录所有点坐标
		        posData = [],         
                //记录所有坐标相对于前面一点的方向				
		        allDirectionData = [],
				 //记录发生改变的方向，如果相对于前一个方向没有发生改变就不进行记录
			    newDirectionData = [],
				//这两个数组用来保存用户自定义的手势数据
				saveData = [],
				saveDirection = [];
		
            var cleanData = function() {
				isTouchStart = false;
	            rotateDirection = 0;
                lastTouch = [];
                currentTouch = [];
            };
			
	        var isDoubleTapOrTap = function() {
				if(configuration.tap) {
				    if(configuration.doubleTap) {
                        if(time.leave) {
	                        if(Date.now() - time.leave < 400) {
	                            console.log("双击");
							    return;
	                        };
	                    };
					};
				    if(Date.now() - time.start < configuration.holdTime) {
					    //延时触发tap事件，防止双击事件也同时触发单击事件
				        clearID.tap = setTimeout(function(){
		                    console.log('单击');
	                    }, 300);
				    };
					
				};
            };

            var isHold = function() {
				if(configuration.hold) {
	                console.log("长按");
				};
            };

            var isPinch = function() {
                var result = false;
				if(configuration.pinch) {
	                if(Math.abs(distance.now - distance.pre) > configuration.pinchDistance) {
	                    result = true;
	                };
				};
	            return result;
            };

            var isRotate = function() {
                var fuHao = true,
				    result = false,
					jiaJiao = 0,
				    nowAngle = getAngle(touchPos.rotateCenter, touchPos.now[0]);
					touchPos.preAngle = touchPos.preAngle ? touchPos.preAngle : nowAngle;

				if(configuration.rotate) {
				    if(nowAngle !== 0) {
					    //检查前后角度符号是否一致，一致返回true
					    fuHao = nowAngle > 0 ? (touchPos.preAngle > 0 ? true : false) : (touchPos.preAngle < 0 ? true : false);
						if(fuHao) {
						    //0表示左边，1表示右边,2表示前后角度相同的情况(第一个点的时候preAngle===nowAngle)
			                touchPos.rotateDirection = (nowAngle - touchPos.preAngle) > 0 ? 0 : (nowAngle - touchPos.preAngle) < 0 ? 1 : 2;
						}
				    };
					//角度符号相同的话相减，不同则需要判断是是接近180还是0度。
					if(fuHao) {
					    jiaJiao = Math.abs(nowAngle - touchPos.preAngle);
					}else {
					    if(Math.abs(nowAngle) + Math.abs(touchPos.preAngle) > 180) {
						    jiaJiao = 360 - Math.abs(nowAngle) - Math.abs(touchPos.preAngle);
						}else if(Math.abs(nowAngle) + Math.abs(touchPos.preAngle) < 180) {
						    jiaJiao = Math.abs(nowAngle) + Math.abs(touchPos.preAngle);
						};
					};
					
	                if(touchPos.rotateDirection === 0) {
					    touchPos.changeAngle = touchPos.changeAngle - jiaJiao;
					}else if(touchPos.rotateDirection === 1) {
					    touchPos.changeAngle = touchPos.changeAngle + jiaJiao;
					};
					touchPos.changeAngle = Math.round(touchPos.changeAngle);
					result = true;
					touchPos.preAngle = nowAngle;
				};
	            return result;
            };

            var isSwipe = function() {
				if(configuration.swipe) {
	                if(Math.abs(touchPos.now[0][0] - touchPos.pre[0][0]) > configuration.swipeDistance || Math.abs(touchPos.now[0][1] - touchPos.pre[0][1]) > configuration.swipeDistance) {
		                console.log('滑动 ' + getDirection(touchPos.pre, touchPos.now));
		            };
				};
            };

            //触屏开始时进行的判断
		    var touchStart = function(e) {
                var fingers = getFingers(e);
                 //检查是否为自定义的手势
		        if(e.target.getAttribute("data-custom")) {
			        posData.push(getPosition(e));
				}else {
				    clearTimeout(clearID.tap);
				    touchPos.pre = getPosition(e);
					touchPos.rotateCenter = getRotateCenter(e.target, touchPos.pre);
	                if(fingers === 1) {
	                    clearID.hold = setTimeout(function(){
	                        isHold();
	                    }, configuration.holdTime);
	                }else if(fingers === 2) {
					    distance.pre = getDistance(touchPos.pre);
				    };
					time.start = Date.now();
				};
				isTouchStart = true;
	            preventDefault(e);
            };

            //在屏幕上滑动时进行的判断
            var touchMove = function(e) {
			    var len, last, fingers, num;
				
			    if(e.target.getAttribute("data-custom")) {
				    len = posData.length;
				    last = len - 1;
					posData.push(getPosition(e));
			        if(len > 1) {
					      //这里posData[last][0] 第二个0只是因为目前考虑一个手指
				        allDirectionData.push(angleToNum(getAngle(posData[last-1][0], posData[last][0]))); 
						num = angleToNum(getAngle(posData[0][0], posData[last][0]));
						if(newDirectionData.length === 0) {
						    newDirectionData.push(num);
						}else if(newDirectionData[newDirectionData.length - 1] !== num) {
						    newDirectionData.push(num);
						};
					};
				}else {
				    if(isTouchStart) {
                        fingers = getFingers(e);
				        touchPos.now = getPosition(e);
				        if(fingers === 1) {
						    isSwipe(fingers);
							if(isRotate()) {
	                            if(touchPos.rotateDirection === 0) {                 
		                            console.log('旋转左边');
		                        }else if(touchPos.rotateDirection === 1) {
		                            console.log('旋转右边');
		                        };
	                        }
	                    }else if(fingers === 2) {
					        distance.now = getDistance(touchPos.now);
					        if(isRotate()) {
	                            if(touchPos.rotateDirection === 0) {                 
		                            console.log('旋转左边');
		                        }else if(touchPos.rotateDirection === 1) {
		                            console.log('旋转右边');
		                        };
	                        }else if(isPinch()) {
	                            if(distance.now - distance.pre > 0) {
		                            console.log('放大');
		                        }else {
		                            console.log('缩小');
		                        };
	                        };
							
				        };
				    };
				};
				preventDefault(e);
            };

            //离开屏幕时进行的判断
            var touchEnd = function(e) {
			    if(e.target.getAttribute("data-custom")) {
				    if(saveData.length === 0) {
		                saveData = allDirectionData.slice(0);
			            saveData = average(saveData);
			            saveDirection = newDirectionData.slice(0);
			            saveDirection = average(saveDirection);
						console.log("已经记录手势");
		            }else {
			            allDirectionData = average(allDirectionData);
			            newDirectionData = average(newDirectionData);
			            if(similarity(saveData, allDirectionData) > 0.9 && similarity(saveDirection, newDirectionData) > 0.9) {
			                console.log("大致相同！");
			            }else {
						    console.log("差太远");
						};
		            };
					posData = [];
					allDirectionData = [];
					newDirectionData = [];
				}else {
				    //去除Hold事件
				    clearTimeout(clearID.hold);
					isDoubleTapOrTap();
	                time.leave = Date.now();
	                cleanData();
				};
				preventDefault(event);
            };
		
			init.setup = function() {
		        "touchstart mousedown".split(" ").forEach(function(item) {
		            listenManage.addListener(element, item, touchStart, false);
		        });
		
		        "touchmove mousemove".split(" ").forEach(function(item) {
		            listenManage.addListener(element, item, touchMove, false);
		        });
		
		        "touchend mouseup".split(" ").forEach(function(item) {
		            listenManage.addListener(element, item, touchEnd, false);
		        });
		
		        "touchcancel mouseout".split(" ").forEach(function(item) {
		            listenManage.addListener(element, item, cleanData, false);
		        });
			};
			
			init.teardown = function() {
			    "touchstart mousedown".split(" ").forEach(function(item) {
		            listenManage.removeListener(element, item, touchStart, false);
		        });
		
		        "touchmove mousemove".split(" ").forEach(function(item) {
		            listenManage.removeListener(element, item, touchMove, false);
		        });
		
		        "touchend mouseup".split(" ").forEach(function(item) {
		            listenManage.removeListener(element, item, touchEnd, false);
		        });
		
		        "touchcancel mouseout".split(" ").forEach(function(item) {
		            listenManage.removeListener(element, item, cleanData, false);
		        });
			};
			
			return init;
		
		};
		
	})();

    //暴露公共接口,on添加手势事件监听
    obj.on = function(element, type, callback) {
	    var eventObject;
		
	    if(instanceManage.hasEventObject(element)) {
		    eventObject = instanceManage.getEventObject(element);
			eventManage.addEvent(element, type, callback);
		}else{
		    eventObject = gestureManage(element);
			instanceManage.setEventObject(element, eventObject);
		    eventObject.setup();
		    eventManage.addEvent(element, type, callback);
		};
	};
	
    //off移除监听
	obj.off = function(element, type) {
	    var eventObject;
		
	    if(instanceManage.hasEventObject(element)) {
		    eventObject = instanceManage.getEventObject(element);
			instanceManage.setEventObject(element);
			eventObject.teardown();
			eventManage.removeEvent(element, type);
		};
	};
	
    //对这个手势识别参数进行配置
	obj.config = function(object) {
	    var name;
	
	    if(typeof object !== "object" || object === object.window || object.nodeType) {
		    return;
		};
	    
		for(name in configuration) {
		    if(object[name] !== null && object[name] !== undefined && !isNaN(object[name])) {
			    if(typeof configuration[name] === typeof object[name]) {
			        configuration[name] = object[name];
				};
			};
		};
	};
	
	return obj;

})(touch);
