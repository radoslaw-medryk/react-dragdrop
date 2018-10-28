import * as React from "react";
import { PositionAbsolute, ElementProps, Point, Size } from "@radoslaw-medryk/react-basics";
import { DragDropContext, OnDropCallback, DragDropContextData } from "./DragDropContext";
import { curry } from "@radoslaw-medryk/react-curry";

export type DragDropElementDetails = {
    isDragged: boolean;
};

export type DragDropElementChildren =
    ((details: DragDropElementDetails) => React.ReactNode)
    | React.ReactNode;

export type DragDropElementProps = {
    position: Point;
    onDropped: (position: Point) => void;
    children: DragDropElementChildren;
} & ElementProps<HTMLDivElement>;

export class DragDropElement extends React.PureComponent<DragDropElementProps, {}> {
    private static nextElementId = 0;

    private elementId: string;
    private observedTopics: string[];

    constructor(props: DragDropElementProps) {
        super(props);

        this.elementId = (DragDropElement.nextElementId++).toString();
        this.observedTopics = [this.elementId];
    }

    public render() {
        const { position } = this.props;

        // TODO [RM]: this.renderInner(position) using curry will cause memory usage increase
        // TODO [RM]: each time position is changed; rethink curry(...) function behavior.
        // TODO [RM]: instead of cacheing all functions just remember last one, maybe?

        return (
            <DragDropContext.Consumer observedTopics={this.observedTopics}>
                {this.renderInner(position)}
            </DragDropContext.Consumer>
        );
    }

    private renderInner = curry(
        (pos: Point) =>
        (context: DragDropContextData) => {
        const {
            ref /*ignored */,
            position /* ignored - provided in prop `pos` */,
            children,
            ...rest } = this.props;

        // TODO [RM]: if any of props changes this will NOT be rerendered,
        // TODO [RM]: because DragDropContext.Consumer controlls render of its children.

        return (
            <DragDropInnerElement
                {...rest}
                position={pos}
                elementId={this.elementId}
                isDragged={!!context.dragged && context.dragged.id === this.elementId}
                setOnDropCallback={context.setOnDropCallback}
                onElementDragStart={context.onElementDragStart}
                onElementDragEnd={context.onElementDragEnd}
            >
                {children}
            </DragDropInnerElement>
        );
    });
}

type SetOnDropCallbackFunc = (id: string, callback: OnDropCallback | null) => void;
type ElementDragStartFunc = (id: string, dragPosition: Point, elementSize: Size) => void;
type ElementDragEndFunc = () => void;

type DragDropInnerElementProps = {
    elementId: string;
    isDragged: boolean;
    setOnDropCallback: SetOnDropCallbackFunc;
    onElementDragStart: ElementDragStartFunc;
    onElementDragEnd: ElementDragEndFunc;
} & DragDropElementProps;

type DragDropInnerElementState = {
    //
};

// tslint:disable-next-line:max-classes-per-file
class DragDropInnerElement extends React.PureComponent<DragDropInnerElementProps, DragDropInnerElementState> {
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
