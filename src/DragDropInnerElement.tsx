import { OnDropCallback } from "./DragDropContext";
import { Point, Size, PositionAbsolute } from "@radoslaw-medryk/react-basics";
import { DragDropElementProps } from "./DragDropElement";
import * as React from "react";
import { curry } from "@radoslaw-medryk/react-curry";

type SetOnDropCallbackFunc = (id: string, callback: OnDropCallback | null) => void;
type ElementDragStartFunc = (id: string, dragPosition: Point, elementSize: Size) => void;
type ElementDragEndFunc = () => void;

type DragDropInnerElementProps = {
    position: Point;
    elementId: string;
    isDragged: boolean;
    setOnDropCallback: SetOnDropCallbackFunc;
    onElementDragStart: ElementDragStartFunc;
    onElementDragEnd: ElementDragEndFunc;
} & DragDropElementProps;

type DragDropInnerElementState = {
    //
};

export class DragDropInnerElement extends React.PureComponent<DragDropInnerElementProps, DragDropInnerElementState> {
    private box: HTMLDivElement | null;

    constructor(props: DragDropInnerElementProps) {
        super(props);

        this.box = null;
    }

    public componentDidMount() {
        const { elementId, setOnDropCallback, onDropped } = this.props;

        setOnDropCallback(elementId, onDropped);
    }

    public componentWillUnmount() {
        const { elementId, setOnDropCallback } = this.props;

        setOnDropCallback(elementId, null);
    }

    public render() {
        const {
            elementId,
            isDragged,
            onElementDragStart,
            onElementDragEnd,
            setOnDropCallback,
            onDropped,
            children,
            ...rest } = this.props;

        let content: React.ReactNode;
        if (typeof children === "function") {
            content = children({
                isDragged: isDragged,
            });
        } else {
            content = children;
        }

        return (
            <PositionAbsolute
                {...rest}
                boxRef={this.setBox}
                draggable={true}
                onDragStart={this.onDragStart(onElementDragStart)}
                onDragEnd={this.onDragEnd(onElementDragEnd)}
            >
                {content}
            </PositionAbsolute>
        );
    }

    private setBox = (box: HTMLDivElement) => {
        this.box = box;
    }

    private onDragStart = curry((onElementDragStart: ElementDragStartFunc) => (e: React.DragEvent<HTMLDivElement>) => {
        const { elementId } = this.props;

        if (!this.box) {
            throw new Error("!this.box");
        }

        const rect = this.box.getBoundingClientRect();
        const dragPosition: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
        const elementSize: Size = {
            width: rect.width,
            height: rect.height,
        };

        onElementDragStart(elementId, dragPosition, elementSize);
    });

    private onDragEnd = curry((onElementDragEnd: ElementDragEndFunc) => () => {
        onElementDragEnd();
    });
}
