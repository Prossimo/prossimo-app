(function (Konva) {

    'use strict';

    // Temporary patch
    // Until in KonvaJS haven't supported custom clipping method (like clip using circle or )
    // If you want to remove it: change a method clipCircle in drawing/module/unit-drawer.js

    Konva.Factory.addGetterSetter(Konva.Container, 'clipType');
    Konva.Factory.addGetterSetter(Konva.Container, 'clipRadius');

    Konva.Container.prototype._drawChildren = function (canvas, drawMethod, top, caching, skipBuffer) {
        var layer = this.getLayer();
        var context = canvas && canvas.getContext();
        var clipWidth = this.getClipWidth();
        var clipHeight = this.getClipHeight();
        var clipType = this.getClipType() || 'rect';
        var clipRadius = this.getClipRadius();
        var hasClip = (clipWidth && clipHeight) || clipRadius;
        var clipX;
        var clipY;

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

        this.children.each(function (child) {
            child[drawMethod](canvas, top, caching, skipBuffer);
        });

        if (hasClip) {
            context.restore();
        }
    };

})(Konva);
