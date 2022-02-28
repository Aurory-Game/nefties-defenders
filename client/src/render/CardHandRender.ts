import { CardId } from 'shared/cards';
import { HAND_SIZE } from 'shared/constants';
import { HEIGHT, WIDTH } from 'scenes/Game';
import CardRender from './CardRender';

export default class CardHandRender {

    scene:Phaser.Scene;
    root:Phaser.GameObjects.Container;
    cards:CardRender[] = [];
    nextCard:CardRender;

    onCardPlay:(index:number, x:number, y:number) => void;

    constructor(scene:Phaser.Scene) {
        this.scene = scene;
        const totalWidth = WIDTH * 0.8;
        const height = HEIGHT * 0.1;
        const x = WIDTH * 0.1;
        const y = HEIGHT - height - HEIGHT * 0.07;
        const cardWidth = totalWidth / (HAND_SIZE + 1);
        this.root = scene.add.container(x, y).setDepth(4);
        const background = scene.add.rectangle(cardWidth, 0, cardWidth * HAND_SIZE, height, 0x333366).setOrigin(0, 0);

        this.root.add([background]);
        for (let i = 0; i < HAND_SIZE; i++) {
            const card = new CardRender(scene, cardWidth * 0.8, height * 0.8);
            card.root
                .setPosition(cardWidth * (i + 1.1), 0.1 * height)
                .setVisible(false);
            this.cards.push(card);
            this.root.add(card.root);
            card.root.setInteractive({
                hitArea: new Phaser.Geom.Rectangle(0, 0, card.width, card.height),
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                draggable: true,
                useHandCursor: true
            });
        }
        this.nextCard = new CardRender(scene, cardWidth * 0.5, height * 0.5);
        this.nextCard.root
            .setPosition(0.25 * cardWidth, 0.4 * height)
            .setVisible(false);
        this.root.add(this.nextCard.root);

        scene.input.on(Phaser.Input.Events.DRAG_END, this.onDragEnd, this);
        scene.input.on(Phaser.Input.Events.DRAG, this.onDrag, this);
    }

    setCard(index:number, id:CardId) {
        const card = index >= 0 ? this.cards[index] : this.nextCard;
        card.set(id);
        card.root.visible = true;
    }

    onDrag(pointer:Phaser.Input.Pointer, obj:GameObject, dragX:number, dragY:number) {
        obj.x = dragX;
        obj.y = dragY;
    }

    onDragEnd(pointer:Phaser.Input.Pointer, obj:GameObject) {
        obj.x = obj.input.dragStartX;
        obj.y = obj.input.dragStartY;
        obj.visible = false;
        if (this.onCardPlay) {
            const index = this.cards.findIndex(cr => cr.root == obj);
            this.onCardPlay(index, pointer.x, pointer.y);
        }
    }

}

type GameObject = Phaser.GameObjects.GameObject
    & Phaser.GameObjects.Components.Transform
    & Phaser.GameObjects.Components.Visible;
