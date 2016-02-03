#!/usr/bin/env python2
import sys
import pygame

class Sprite:

    def __init__(self):
        self.lines = []
        self.colors = {}
        self.width = 0
        self.height = 0

    def add_color(self, c, color):
        v = color.decode('hex')
        if not v:
            rgba = (0,0,0,0)
        elif len(v) == 1:
            rgba = (ord(v), ord(v), ord(v), 255)
        elif len(v) == 3:
            rgba = (ord(v[0]), ord(v[1]), ord(v[2]), 255)
        elif len(v) == 4:
            rgba = (ord(v[0]), ord(v[1]), ord(v[2]), ord(v[3]))
        else:
            raise ValueError(color)
        self.colors[c] = rgba

    def add_line(self, line):
        self.lines.append(line)
        self.width = max(self.width, len(line))
        self.height += 1

    def render(self, img, x, y):
        for (dy,line) in enumerate(self.lines):
            for (dx,c) in enumerate(line):
                color = self.colors[c]
                img.set_at((x+dx,y+dy), color)
            
class SpriteSheet:

    def __init__(self):
        self.sprites = []
        return

    def load(self, fp):
        sprite = Sprite()
        for line in fp:
            line = line.strip()
            if not line: 
                self.sprites.append(sprite)
                sprite = Sprite()
            else:
                (line,_,_) = line.partition('#')
                if line.startswith('+'):
                    (c,_,color) = line[1:].partition(':')
                    sprite.add_color(c, color)
                elif line:
                    sprite.add_line(line)
        self.sprites.append(sprite)
        return

    def getsize(self):
        width = 0
        height = 0
        for sprite in self.sprites:
            width += sprite.width
            height = max(height, sprite.height)
        return (width, height)

    def getimage(self):
        (width, height) = self.getsize()
        (x, y) = (0, 0)
        img = pygame.Surface((width,height), pygame.SRCALPHA, 32)
        for sprite in self.sprites:
            sprite.render(img, x, y+height-sprite.height)
            x += sprite.width
        return img

def main(argv):
    import fileinput
    ss = SpriteSheet()
    ss.load(fileinput.input())
    img = ss.getimage()
    pygame.image.save(img, 'out.png')
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv))
