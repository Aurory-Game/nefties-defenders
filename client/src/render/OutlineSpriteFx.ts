const fragShader = `
#define SHADER_NAME OUTLINE_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uThickness;
uniform vec3 uOutlineColor;

varying vec2 outTexCoord;

const float TAU = 3.141592653 * 2.;
const float STEP = (3.141592653 * 2.) / 10.;

void main() {
    vec4 front = texture2D(uMainSampler, outTexCoord);
    if (uThickness > 0.0) {
      vec2 mag = vec2(uThickness/uResolution.x, uThickness/uResolution.y);
      vec4 curColor;
      float maxAlpha = front.a;
      vec2 offset;
      for (float angle = 0.; angle < TAU; angle += STEP) {
          offset = vec2(mag.x * cos(angle), mag.y * sin(angle));        
          curColor = texture2D(uMainSampler, outTexCoord + offset);
          maxAlpha = max(maxAlpha, curColor.a);
      }
      vec3 resultColor = front.rgb + (uOutlineColor.rgb * (1. - front.a)) * maxAlpha;
      gl_FragColor = vec4(resultColor, maxAlpha);
    } else {
      gl_FragColor = front;
    }
  }
`;

export default class OutlineSpriteFX extends Phaser.Renderer.WebGL.Pipelines.SpriteFXPipeline {

    public thickness:number;
    public color:Phaser.Display.Color;

    constructor (game:Phaser.Game) {
        super({
            game,
            fragShader
        });
        this.thickness = 1;
        this.color = new Phaser.Display.Color();
    }

    onPreRender () {
        this.set1f('uThickness', this.thickness);
        this.set3f('uOutlineColor', this.color.redGL, this.color.greenGL, this.color.blueGL);
    }

    onDraw (renderTarget:Phaser.Renderer.WebGL.RenderTarget) {
        this.set2f('uResolution', renderTarget.width, renderTarget.height);

        this.drawToGame(renderTarget);
    }
}
