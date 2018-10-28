import * as React from "react";
import { Point, Size } from "@radoslaw-medryk/react-basics";
import { createPubSub } from "@radoslaw-medryk/react-pubsub";

export type OnDropCallback = (position: Point) => void;
export type Dragged = { id: string, dragPosition: Point, elementSize: Size } | null;

export type DragDropContextData = {
    dragged: Dragged;
    onDropCallbacks: { [id: string]: OnDropCallback | undefined }; // TODO [RM]: hide?
} & DragDropContextFunctions;

export type DragDropContextFunctions = {
    onElementDragStart: (id: string, dragPosition: Point, elementSize: Size) => void;
    onElementDragEnd: () => void;
    onDrop: (elementId: string, position: Point) => void;
    setOnDropCallback: (id: string, callback: OnDropCallback | null) => void;
};

export type DragDropContextProviderProps = {
    //
};

export type DragDropContextProviderState = DragDropContextData;

const calculateChangedTopics = (prev: DragDropContextData, next: DragDropContextData) => {
    const prevId = prev.dragged ? prev.dragged.id : null;
    const nextId = next.dragged ? next.dragged.id : null;

    // Empty string is threated as a valid topic here.
    // TODO [RM]: Don't allow empty string topic? threat as null/undefined?

    if (prevId === nextId) {
        return [];
    }

    if (prevId === null || nextId === null) {
        return [prevId !== null ? prevId : nextId as string];
    }

    return [prevId, nextId];
};

const Context = createPubSub<DragDropContextData>({
    dragged: null,
    onDropCallbacks: {},

    onElementDragStart: () => null,
    onElementDragEnd: () => null,
    onDrop: () => null,
    setOnDropCallback: () => null,
}, calculateChangedTopics);

export class DragDropContextProvider
extends React.Component<DragDropContextProviderProps, DragDropContextProviderState> {
    constructor(props: DragDropContextProviderProps) {
        super(props);

        this.state = {
            dragged: null,
            onDropCallbacks: {},

            setOnDropCallback: this.setOnDropCallback,
            onElementDragEnd: this.onElementDragEnd,
            onElementDragStart: this.onElementDragStart,
            onDrop: this.onDrop,
        };
    }

    public render() {
        return (
            <Context.Provider value={this.state}>
                {this.props.children}
            </Context.Provider>
        );
    }

    private setOnDropCallback = (id: string, callback: OnDropCallback | null) => {
        const newCallback = !!callback
            ? callback
            : undefined;

        this.setState(state => ({
            onDropCallbacks: { ...state.onDropCallbacks, [id]: newCallback },
        }));
    }

    private onElementDragStart = (id: string, dragPosition: Point, elementSize: Size) => {
        this.setState({
            dragged: {
                id: id,
                dragPosition: dragPosition,
                elementSize: elementSize,
            },
        });
    }

    private onElementDragEnd = () => {
        this.setState({
            dragged: null,
        });
    }

    private onDrop = (id: string, position: Point) => {
        const callback = this.state.onDropCallbacks[id];
        if (!callback) {
            return;
        }

        callback(position);
    }
}

export const DragDropContext = {
    Consumer: Context.Consumer,
    Provider: DragDropContextProvider,
};
