using System;
using System.Collections.Generic;
using System.Text;

namespace FunctionApp
{
    public class Color
    {
        public byte r;
        public byte g;
        public byte b;
        public byte a;

        public static Color FromDouble(double r, double g, double b)
        {
            return new Color
            {
                r = ToByte(r),
                g = ToByte(g),
                b = ToByte(b),
                a = 255
            };
        }

        static private byte ToByte(double d)
        {
            return d > 255 ? (byte)255 : (byte)Math.Floor(d);
        }
    }

    public class FractalInit
    {
        public int height;
        public int maxIterations;
        public int width;
        public double xMax;
        public double xMin;
        public double yMax;
        public double yMin;
    }

    public class FractalMandelbrot
    {
        int height;
        int maxIterations;
        int width;
        double xMax;
        double xScale;
        double xMin;
        double yMax;
        double yScale;
        double yMin;
        byte[] pixels;
        Random rnd = new Random();

        public FractalMandelbrot(FractalInit init)
        {
            this.xMin = init.xMin;
            this.xMax = init.xMax;
            this.yMin = init.yMin;
            this.yMax = init.yMax;
            this.width = init.width;
            this.height = init.height;
            this.maxIterations = init.maxIterations;
            this.pixels = new byte[width * height * 4];
        }
        void updatePixel(int index, byte r, byte g, byte b, byte a = 255)
        {
            this.pixels[index] = r;
            this.pixels[index + 1] = g;
            this.pixels[index + 2] = b;
            this.pixels[index + 3] = a;
        }
        int coord2Index(int x, int y)
        {
            return 4 * (y * this.width + x);
        }

        int iterate(double t, double e, double n, double i, int r)
        {
            for (var o = 0; ;)
            {
                if (++o > r) return 0;
                var s = 2 * e * t + i;
                if (t > 4 || e > 4) return o;
                t = t * t - e * e + n;
                e = s;
            }
        }

        public byte[] compute()
        {
            this.xScale = (this.xMax - this.xMin) / this.width;
            this.yScale = (this.yMax - this.yMin) / this.height;

            for (var t = 0; t < this.width; t++)
                for (var e = 0; e < this.height; e++)
                {
                    var n = this.iterate(0, 0, t * this.xScale + this.xMin, e * this.yScale + this.yMin, this.maxIterations);
                    if (n == this.maxIterations)
                    {
                        this.updatePixel(this.coord2Index(t, e), 0, 0, 0);
                    }
                    else
                    {
                        Color c = this.getColor(n, this.maxIterations);
                        this.updatePixel(this.coord2Index(t, e), c.r, c.g, c.b);
                    }
                }
            //return new ImageData(Uint8ClampedArray.from(this.pixels),this.width,this.height);
            //return Uint8ClampedArray.from(this.pixels);
            return this.pixels;
        }
        Color getColor(int iteration, double maxiterations)
        {   // t,e
            //int top = (int)Math.Floor(maxiterations);
            //iteration = rnd.Next() % top;
            double n = iteration / maxiterations;
            double r = 0;  // (i, r, o)
            double g = 0;
            double b = 0;
            //return Color.FromDouble(n / .125 * 512 + .5, 0, 0);
            if (n >= 0 && n < .125)
            {
                return Color.FromDouble(n / .125 * 512 + .5, 0, 0);
            };

            if (n >= .125 && n < .25)
            {
                return Color.FromDouble(255, (n - .125) / .125 * 512 + .5, 0);
            }

            if (n >= .25 && n < .375)
            {
                return Color.FromDouble(512 * (1 - (n - .25) / .125) + .5, 255, 0);
            }
            if (n >= .375 && n < .5)
            {
                return Color.FromDouble(0, 255, (n - .375) / .125 * 512 + .5);
            }
            if (n >= .5 && n < .625)
            {
                return Color.FromDouble(0, 512 * (1 - (n - .5) / .125) + .5, 255);
            }
            if (n >= .625 && n < .75)
            {
                return Color.FromDouble((n - .625) / .125 * 512 + .5, 0, 255);
            }
            if (n >= .75 && n < .875)
            {
                return Color.FromDouble(255, (n - .75) / .125 * 512 + .5, 255);
            }
            if (n >= .875 && n <= 1)
            {
                return Color.FromDouble(512 * (1 - (n - .875) / .125) + .5, 512 * (1 - (n - .875) / .125) + .5, 512 * (1 - (n - .875) / .125) + .5);
            }

            throw new ArgumentOutOfRangeException(nameof(iteration));

            //    FractalMandelbrot.prototype.toInteger = function(t)
            //    {
            //        return Math[t < 0 ? "ceil" : "floor"](t)
            //}


        }
    }
}

