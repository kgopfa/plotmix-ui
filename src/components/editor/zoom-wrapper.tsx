import React, { forwardRef, useImperativeHandle } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { EditorZoomRef } from '@/hooks/use-editor-zoom';

interface ZoomWrapperProps {
  children: React.ReactNode;
  className?: string;
  onZoomChange?: (zoom: number) => void;
}

export const ZoomWrapper = forwardRef<EditorZoomRef, ZoomWrapperProps>(
  ({ children, className = '', onZoomChange }, ref) => {
    const transformRef = React.useRef<ReactZoomPanPinchRef>(null);

    useImperativeHandle(ref, () => ({
      zoomIn: () => {
        if (transformRef.current) {
          transformRef.current.zoomIn();
        }
      },
      zoomOut: () => {
        if (transformRef.current) {
          transformRef.current.zoomOut();
        }
      },
      resetZoom: () => {
        if (transformRef.current) {
          transformRef.current.resetTransform();
        }
      },
      setZoom: (scale: number) => {
        if (transformRef.current) {
          const { positionX, positionY } = transformRef.current.instance.transformState;
          transformRef.current.setTransform(positionX, positionY, scale);
        }
      },
      getCurrentZoom: () => {
        if (transformRef.current) {
          return transformRef.current.instance.transformState.scale;
        }
        return 1;
      },
      centerOnElement: (id?: string) => {
        if (transformRef.current && id) {
          // This would need to be implemented with element positioning logic
          // For now, just center the viewport
          transformRef.current.centerView();
        }
      },
      zoomToFitElement: (id?: string) => {
        if (transformRef.current && id) {
          // This would need to be implemented with element bounds calculation
          // For now, just center the viewport
          transformRef.current.centerView();
        }
      },
      getViewportCenter: () => {
        if (transformRef.current) {
          const { positionX, positionY } = transformRef.current.instance.transformState;
          return { x: positionX, y: positionY };
        }
        return { x: 0, y: 0 };
      },
      resetToCenter: () => {
        if (transformRef.current) {
          transformRef.current.centerView();
        }
      },
      resetZoomToOneHundredPercent: () => {
        if (transformRef.current) {
          const { positionX, positionY } = transformRef.current.instance.transformState;
          transformRef.current.setTransform(positionX, positionY, 1);
        }
      },
    }));

    return (
      <div className={`${className}`} style={{ touchAction: 'none' }}>
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          limitToBounds={false}
          centerOnInit={true}
          wheel={{
            step: 0.1,
            disabled: false,
          }}
          pinch={{
            step: 5,
          }}
          doubleClick={{
            step: 0.5,
            mode: 'zoomIn',
          }}
          onTransformed={(ref, state) => {
            if (onZoomChange) {
              onZoomChange(state.scale);
            }
          }}
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full"
            wrapperStyle={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f1f5f9', // slate-100 color
            }}
            contentStyle={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f1f5f9', // slate-100 color
            }}
          >
            {children}
          </TransformComponent>
        </TransformWrapper>
      </div>
    );
  }
);

ZoomWrapper.displayName = 'ZoomWrapper'; 