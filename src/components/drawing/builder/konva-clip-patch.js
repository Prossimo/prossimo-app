import Konva from 'konva';

// Temporary patch
// Until in KonvaJS haven't supported custom clipping method (like clip using circle or )
// If you want to remove it: change a method clipCircle in drawing/builder/drawers/unit-drawer.js

Konva.Factory.addGetterSetter(Konva.Container, 'clipType');
Konva.Factory.addGetterSetter(Konva.Container, 'clipRadius');

Konva.Container.prototype._drawChildren = function drawChildren(canvas, drawMethod, top, caching, skipBuffer) {
    const layer = this.getLayer();
    const context = canvas && canvas.getContext();
    const clipWidth = this.getClipWidth();
    const clipHeight = this.getClipHeight();
    const clipType = this.getClipType() || 'rect';
    const clipRadius = this.getClipRadius();
    const hasClip = (clipWidth && clipHeight) || clipRadius;
    let clipX;
    let clipY;

    if (hasClip && layer) {
        clipX = this.getClipX();
        clipY = this.getClipY();

        context.save();
        layer._applyTransform(this, context);
        context.beginPath();

        if (clipType === 'rect') {
            context.rect(clipX, clipY, clipWidth, clipHeight);
        } else {
            context.arc(clipX + clipRadius, clipY + clipRadius, clipRadius, 0, 2 * Math.PI, false);
        }

        context.clip();
        context.reset();
    }

    this.children.each((child) => {
        child[drawMethod](canvas, top, caching, skipBuffer);
    });

    if (hasClip) {
        context.restore();
    }
};

export default Konva;
