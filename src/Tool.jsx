import React, { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import ReactLive2d from 'react-live2d';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { VideoRecorder } from './VideoChat';

import './VideoChat.css';
import {
    DeviceType, GlobalSignal, Window_Max_Height_Factor
} from './ConstDefine';

function FloatBall({ setElementSize, props }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [ffmpeg, setFfmpeg] = useState(new FFmpeg({ log: true }));
    const [recorder, setRecorder] = useState();
    const [screenStream, setScreenStream] = useState();
    const chunksRef = useRef([]);
    const blobRef = useRef(null);

    useEffect(() => {
        if (props?.isBeingDragged) {
            setIsExpanded(false);
        }
    }, [props?.isBeingDragged]);

    useEffect(() => {
        if (props?.clickOutside) {
            props?.setClickOutside(false);
            setIsExpanded(false);
        }
    }, [props?.clickOutside])

    useEffect(() => {
        if (props.elementRef) {
            const { width, height } = props.elementRef.current.getBoundingClientRect();
            setElementSize({ width, height });
        }
    }, [props?.elementRef]);

    const toggleExpand = () => {
        if (!props.isDragging) {
            setIsExpanded(prev => !prev);
        }
    };

    const onVideoCallBtnClick = () => {
        props?.enterVideoChatView();
        props?.setVideoCallModalOpen(true);
        toggleExpand();
        props?.setPosition({ x: props?.bounds?.right / 2, y: props?.bounds?.bottom });
    };

    const onLive2DBtnClick = () => {
        props?.setShowLive2DRole(prev => !prev);
        toggleExpand();
    };

    const onReturnMenuBtnClick = () => {
        props?.setGlobalSignal(prev => ({ ...prev, [GlobalSignal.Active]: true, [GlobalSignal.ReturnMenu]: true }));
        toggleExpand();
    };

    return (
        <div ref={props.elementRef} className="floating-button-container">
            <div className={`floating-button ${isExpanded ? 'expanded' : ''}
            ${props.isBeingDragged ? 'dragging' : ''}`}
                onClick={toggleExpand}
                onTouchStart={toggleExpand}
            >
                <span className="fas fa-plus"></span>
            </div>
            {
                <div className={`floating-button-options ${props.componentBoundPos} ${isExpanded ? 'expand' : ''}`}>
                    <button onClick={onVideoCallBtnClick}
                        onTouchStart={onVideoCallBtnClick}>
                        视频通话
                    </button>

                    {props.deviceType === DeviceType.PC &&
                        <button onClick={onLive2DBtnClick}
                            onTouchStart={onLive2DBtnClick}>
                            {props?.showLive2DRole ? '隐藏角色' : '显示角色'}
                        </button>
                    }

                    <VideoRecorder setSaveVideoModalOpen={props?.setSaveVideoModalOpen}
                        globalSignal={props?.globalSignal}
                        setGlobalSignal={props?.setGlobalSignal}
                        isRecording={isRecording}
                        setIsRecording={setIsRecording}
                        ffmpeg={ffmpeg}
                        recorder={recorder}
                        setRecorder={setRecorder}
                        screenStream={screenStream}
                        setScreenStream={setScreenStream}
                        chunksRef={chunksRef}
                        blobRef={blobRef}
                        toggleExpand={toggleExpand}
                    />

                    <button onClick={onReturnMenuBtnClick}
                        onTouchStart={onReturnMenuBtnClick}>
                        返回主页
                    </button>
                </div>
            }
        </div >
    );
}

function DraggableComponent({ Element, props }) {
    const [bounds, setBounds] = useState();
    const [elementSize, setElementSize] = useState();
    const [isDragging, setIsDragging] = useState(false); // 是否拖拽行为
    const [isBeingDragged, setIsBeingDragged] = useState(false); // 是否正在被拖拽
    const [position, setPosition] = useState();
    const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
    const [componentBoundPos, setComponentBoundPos] = useState('');
    const [clickOutside, setClickOutside] = useState(false);
    const [overlap, setOverlap] = useState(false);

    const elementRef = useRef(null);

    useEffect(() => {
        props?.setFloatButtonVisible(!overlap);
    }, [overlap]);

    useEffect(() => {
        if (props?.globalSignal && props?.globalSignal[GlobalSignal.Active]) {
            if (props?.globalSignal[GlobalSignal.SetFloatBallPosion] === 'bottom-center') {
                setPosition({ x: bounds.right / 2, y: bounds.bottom });
            }
        }
    }, [props?.globalSignal]);

    useEffect(() => {
        if (!elementRef.current) return;
        const handleDragableOutsideClick = (event) => {
            if (elementRef.current && !elementRef.current.contains(event.target)) {
                setClickOutside(true);
            }
        };
        document.addEventListener('click', handleDragableOutsideClick);
        return () => {
            document.removeEventListener('click', handleDragableOutsideClick);
        };
    }, [elementRef.current]);

    const loadEle = () => {
        const { width, height } = elementSize;
        if (!width || !height) return;
        setBounds({
            left: 0,
            top: 0,
            right: window.innerWidth - width,
            bottom: (window.innerHeight) * Window_Max_Height_Factor - height,
        });
        const initialX = (window.innerWidth - width) / 2;
        const initialY = 0;
        setPosition({ x: initialX, y: initialY });
    }

    useEffect(() => {
        if (elementSize) {
            loadEle();
        }
    }, [elementSize]);

    const handleStart = (e, ui) => {
        setIsDragging(false);
        setInitialPosition({ x: ui.x, y: ui.y });
    };

    const checkComponentBoundPos = (x, y) => {
        if (x === 0) {
            setComponentBoundPos('left');
        }
        else if (x === bounds.right) {
            setComponentBoundPos('right');
        }
        else if (y === 0) {
            setComponentBoundPos('top');
        }
        else if (y === bounds.bottom) {
            setComponentBoundPos('bottom');
        }
    }

    const handleStop = (e, ui) => {
        const { x, y } = ui;
        const deltaX = x - initialPosition.x;
        const deltaY = y - initialPosition.y;
        const threshold = 5;
        if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
            setIsDragging(true);
        } else {
            setIsDragging(false);
        }
        const { nx, ny } = trans(x, y);
        setPosition({ x: nx, y: ny });
        checkComponentBoundPos(nx, ny);
        setIsBeingDragged(false);
    };

    const trans = (x, y) => {
        let nx = x, ny = y;
        if (x === 0 || x === bounds.right || y === 0 || y === bounds.bottom) {
            return { nx: nx, ny: ny };
        }
        else if (x / y < window.innerWidth / window.innerHeight) {
            if (x < bounds.bottom - y) {
                nx = bounds.left;
            }
            else {
                ny = bounds.bottom;
            }
        }
        else {
            if (bounds.right - x < y) {
                nx = bounds.right;
            }
            else {
                ny = bounds.top;
            }
        }
        return { nx: nx, ny: ny };
    }

    const handleDrag = (e, ui) => {
        setIsBeingDragged(true);
        checkOverlap(e, ui, 'float-button-icon');
    };

    const checkOverlap = (event, ui, id) => {
        const draggableBounds = event.target.getBoundingClientRect();
        if (draggableBounds.left === 0 || draggableBounds.right === 0) return;
        const imgBounds = document.getElementById(id).getBoundingClientRect();
        const draggableCenterX = (draggableBounds.left + draggableBounds.right) / 2;
        const draggableCenterY = (draggableBounds.top + draggableBounds.bottom) / 2;
        const imgCenterX = (imgBounds.left + imgBounds.right) / 2;
        const imgCenterY = (imgBounds.top + imgBounds.bottom) / 2;
        const draggableHalfWidth = (draggableBounds.right - draggableBounds.left) / 2;
        const distance = Math.sqrt(Math.pow(draggableCenterX - imgCenterX, 2) + Math.pow(draggableCenterY - imgCenterY, 2));
        if (distance < draggableHalfWidth) {
            setOverlap(true);
        } else {
            setOverlap(false);
        }
    };

    return (
        <Draggable
            bounds={bounds}
            position={position}
            onStart={handleStart}
            onStop={handleStop}
            onDrag={handleDrag}
        >
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 20,
                opacity: props?.floatButtonVisible ? '1' : '0',
            }}>
                <Element setElementSize={setElementSize} props={{
                    ...props,
                    elementRef, isDragging, componentBoundPos, clickOutside,
                    setClickOutside, isBeingDragged, setPosition, bounds
                }} />
            </div>
        </Draggable>
    );
}

function DraggableButton({ showLive2DRole, setShowLive2DRole, setGlobalSignal,
    setVideoCallModalOpen, deviceType, setSaveVideoModalOpen, globalSignal,
    enterVideoChatView, floatButtonVisible, setFloatButtonVisible,
}) {
    return (
        <DraggableComponent Element={FloatBall} props={{
            showLive2DRole,
            setShowLive2DRole,
            setGlobalSignal,
            setVideoCallModalOpen,
            deviceType,
            setSaveVideoModalOpen,
            globalSignal,
            enterVideoChatView,
            floatButtonVisible,
            setFloatButtonVisible,
        }} />
    );
}


function Live2DRole() {
    return (
        <ReactLive2d
            width={250}
            height={450}
        />
    );
}

export {
    DraggableButton, Live2DRole
}