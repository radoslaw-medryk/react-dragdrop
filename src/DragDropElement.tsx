import * as React from "react";
import { ElementProps, Point } from "@radoslaw-medryk/react-basics";
import { DragDropContext, DragDropContextData } from "./DragDropContext";
import { curry } from "@radoslaw-medryk/react-curry";
import { DragDropInnerElement } from "./DragDropInnerElement";

// TODO [RM]: Add stack ordering - so dropped component always land on top.

export type DragDropElementDetails = {
    isDragged: boolean;
};

export type DragDropElementChildren =
    ((details: DragDropElementDetails) => React.ReactNode)
    | React.ReactNode;

export type DragDropElementProps = {
    position?: Point;
    defaultPosition?: Point;
    onDropped: (position: Point) => void;
    children: DragDropElementChildren;
} & ElementProps<HTMLDivElement>;
// TODO [RM]: don't allow ElementProps<...> on DragDropElement

export type DragDropElementState = {
    uncontrolledPosition: Point | null;
};

export class DragDropElement extends React.PureComponent<DragDropElementProps, DragDropElementState> {
    private static nextElementId = 0;

    private elementId: string;
    private observedTopics: string[];
    private isControlled: boolean;

    constructor(props: DragDropElementProps) {
        super(props);

        this.elementId = (DragDropElement.nextElementId++).toString();
        this.observedTopics = [this.elementId];
        this.isControlled = !!props.position;

        this.state = {
            uncontrolledPosition: this.isControlled
                ? null
                : props.defaultPosition || {x: 0, y: 0},
        };
    }

    public componentDidMount() {
        this.validateProps(this.props);
    }

    public componentDidUpdate() {
        this.validateProps(this.props);
    }

    public render() {
        const position = this.isControlled
            ? this.props.position
            : this.state.uncontrolledPosition;

        if (!position) {
            throw new Error("!position");
        }

        // TODO [RM]: this.renderInner(position) using curry will cause memory usage increase
        // TODO [RM]: each time position is changed; rethink curry(...) function behavior.
        // TODO [RM]: instead of cacheing all functions just remember last one, maybe?

        return (
            <DragDropContext.Consumer observedTopics={this.observedTopics}>
                {this.renderInner(position)}
            </DragDropContext.Consumer>
        );
    }

    private validateProps(props: DragDropElementProps) {
        if (this.isControlled) {
            if (!props.position) {
                throw new Error("Prop `position` is not provided. It must be provided for controlled component.");
            }
            if (!!props.defaultPosition) {
                console.warn("Prop `defaultPosition` is provided. It is ignored for controlled component.");
            }
        } else {
            if (!!props.position) {
                console.warn("Prop `position` is provided. It is ignored for uncontrolled component.");
            }
        }
    }

    private renderInner = curry(
        (pos: Point) =>
        (context: DragDropContextData) => {
        const {
            ref, /*ignored */
            position, /* ignored - provided in prop `pos` */
            onDropped, /* ignored - we use our wrapper first */
            defaultPosition, /* ignored */
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
                onDropped={this.onDropped}
                setOnDropCallback={context.setOnDropCallback}
                onElementDragStart={context.onElementDragStart}
                onElementDragEnd={context.onElementDragEnd}
            >
                {children}
            </DragDropInnerElement>
        );
    });

    private onDropped = (position: Point) => {
        const { onDropped } = this.props;

        if (!this.isControlled) {
            this.setState({
                uncontrolledPosition: position,
            });
        }

        if (onDropped) {
            onDropped(position);
        }
    }
}
