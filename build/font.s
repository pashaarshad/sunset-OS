	.file	"font.c"
	.text
	.section .rdata,"dr"
	.align 32
_font_bitmap:
	.ascii "\0\0\0\0\0\0\0\0"
	.ascii "\30\30\30\30\30\0\30\0"
	.ascii "lll\0\0\0\0\0"
	.ascii "66\177"
	.ascii "6\177"
	.ascii "66\0"
	.ascii "\30>`<\6|\30\0"
	.ascii "\0ff\14\30"
	.ascii "33\0"
	.ascii "<f<8gf?\0"
	.ascii "\30\30\30\0\0\0\0\0"
	.ascii "\14\30"
	.ascii "000\30\14\0"
	.ascii "0\30\14\14\14\30"
	.ascii "0\0"
	.ascii "\0f<\377<f\0\0"
	.ascii "\0\30\30~\30\30\0\0"
	.ascii "\0\0\0\0\0\30\30"
	.ascii "0"
	.ascii "\0\0\0~\0\0\0\0"
	.ascii "\0\0\0\0\0\30\30\0"
	.ascii "\6\14\30"
	.ascii "0`\300\200\0"
	.ascii ">cgksc>\0"
	.ascii "\14\34\14\14\14\14>\0"
	.ascii ">c\6\34"
	.ascii "0`\177\0"
	.ascii "\177\6\14\34\6c>\0"
	.ascii "\14\34<l\177\14\14\0"
	.ascii "\177`~\3\3c>\0"
	.ascii "\34"
	.ascii "0`~cc>\0"
	.ascii "\177\3\6\14\30\30\30\0"
	.ascii ">cc>cc>\0"
	.ascii ">cc\177\3\6<\0"
	.ascii "\0\30\30\0\0\30\30\0"
	.ascii "\0\30\30\0\0\30\30"
	.ascii "0"
	.ascii "\14\30"
	.ascii "0`0\30\14\0"
	.ascii "\0\0~\0~\0\0\0"
	.ascii "0\30\14\6\14\30"
	.ascii "0\0"
	.ascii ">c\3\6\14\0\14\0"
	.ascii ">cokk`>\0"
	.ascii "\30<ff\177ff\0"
	.ascii "~cc|cc~\0"
	.ascii ">c```c>\0"
	.ascii "|fffff|\0"
	.ascii "\177``|``\177\0"
	.ascii "\177``|```\0"
	.ascii ">c`occ>\0"
	.ascii "fff\177fff\0"
	.ascii ">\14\14\14\14\14>\0"
	.ascii "\7\3\3\3\3#\36\0"
	.ascii "flxpxlf\0"
	.ascii "``````\177\0"
	.ascii "cw\177kccc\0"
	.ascii "fn~vfff\0"
	.ascii ">ccccc>\0"
	.ascii "~cc~```\0"
	.ascii ">ccckf=\0"
	.ascii "~cc~xlf\0"
	.ascii ">c8\16\7c>\0"
	.ascii "\177\30\30\30\30\30\30\0"
	.ascii "ffffff>\0"
	.ascii "ffff<\30\30\0"
	.ascii "ccck\177>\"\0"
	.ascii "ff<\30<ff\0"
	.ascii "ff<\30\30\30\30\0"
	.ascii "\177\3\6\14\30"
	.ascii "0\177\0"
	.ascii ">00000>\0"
	.ascii "\300`0\30\14\6\3\0"
	.ascii "\30<f\0\0\0\0\0"
	.ascii "\0\0\0\0\0\0\0\377"
	.ascii "0\30\14\0\0\0\0\0"
	.ascii "\0\0>\3?c?\0"
	.ascii "``~ccc~\0"
	.ascii "\0\0>``c>\0"
	.ascii "\3\3?ccc?\0"
	.ascii "\0\0>c\177`>\0"
	.ascii "\34"
	.ascii "0|0000\0"
	.ascii "\0?cc?\3>\0"
	.ascii "``|ffff\0"
	.ascii "\30\0\30\30\30\30\34\0"
	.ascii "\6\0\6\6\6&\34\0"
	.ascii "`flxxlf\0"
	.ascii "000000\34\0"
	.ascii "\0\0w\177kcc\0"
	.ascii "\0\0|ffff\0"
	.ascii "\0\0>ccc>\0"
	.ascii "\0\0~cc~``"
	.ascii "\0\0?cc?\3\3"
	.ascii "\0\0|f```\0"
	.ascii "\0\0>`>\3>\0"
	.ascii "00|003\36\0"
	.ascii "\0\0ffff?\0"
	.ascii "\0\0fff<\30\0"
	.ascii "\0\0cck\177>\0"
	.ascii "\0\0f<\30<f\0"
	.ascii "\0\0ff?\3>\0"
	.ascii "\0\0\177\14\30"
	.ascii "0\177\0"
	.ascii "\16\30\30p\30\30\16\0"
	.ascii "\30\30\30\30\30\30\30\0"
	.ascii "p\30\30\16\30\30p\0"
	.ascii "v\334\0\0\0\0\0\0"
	.ascii "\0\20"
	.ascii "8|\376|8\20"
	.space 8
	.text
	.globl	_draw_char
	.def	_draw_char;	.scl	2;	.type	32;	.endef
_draw_char:
LFB0:
	.cfi_startproc
	pushl	%ebp
	.cfi_def_cfa_offset 8
	.cfi_offset 5, -8
	movl	%esp, %ebp
	.cfi_def_cfa_register 5
	subl	$36, %esp
	cmpl	$0, 12(%ebp)
	js	L11
	cmpl	$792, 12(%ebp)
	jg	L11
	cmpl	$0, 16(%ebp)
	js	L11
	cmpl	$592, 16(%ebp)
	jg	L11
	cmpb	$31, 8(%ebp)
	jg	L5
	movb	$63, 8(%ebp)
L5:
	movsbl	8(%ebp), %eax
	subl	$32, %eax
	movl	%eax, -12(%ebp)
	movl	$0, -4(%ebp)
	jmp	L6
L10:
	movl	-12(%ebp), %eax
	leal	0(,%eax,8), %edx
	movl	-4(%ebp), %eax
	addl	%edx, %eax
	addl	$_font_bitmap, %eax
	movzbl	(%eax), %eax
	movb	%al, -13(%ebp)
	movl	$0, -8(%ebp)
	jmp	L7
L9:
	movzbl	-13(%ebp), %edx
	movl	$7, %eax
	subl	-8(%ebp), %eax
	movl	%eax, %ecx
	sarl	%cl, %edx
	movl	%edx, %eax
	andl	$1, %eax
	testl	%eax, %eax
	je	L8
	movl	16(%ebp), %edx
	movl	-4(%ebp), %eax
	leal	(%edx,%eax), %ecx
	movl	12(%ebp), %edx
	movl	-8(%ebp), %eax
	addl	%eax, %edx
	movzbl	28(%ebp), %eax
	movl	%eax, 16(%esp)
	movzbl	24(%ebp), %eax
	movl	%eax, 12(%esp)
	movzbl	20(%ebp), %eax
	movl	%eax, 8(%esp)
	movl	%ecx, 4(%esp)
	movl	%edx, (%esp)
	call	_draw_pixel
L8:
	addl	$1, -8(%ebp)
L7:
	cmpl	$7, -8(%ebp)
	jle	L9
	addl	$1, -4(%ebp)
L6:
	cmpl	$7, -4(%ebp)
	jle	L10
	jmp	L1
L11:
	nop
L1:
	leave
	.cfi_restore 5
	.cfi_def_cfa 4, 4
	ret
	.cfi_endproc
LFE0:
	.globl	_draw_string
	.def	_draw_string;	.scl	2;	.type	32;	.endef
_draw_string:
LFB1:
	.cfi_startproc
	pushl	%ebp
	.cfi_def_cfa_offset 8
	.cfi_offset 5, -8
	movl	%esp, %ebp
	.cfi_def_cfa_register 5
	subl	$40, %esp
	movl	12(%ebp), %eax
	movl	%eax, -4(%ebp)
	movl	16(%ebp), %eax
	movl	%eax, -8(%ebp)
	movl	$0, -12(%ebp)
	jmp	L13
L16:
	movl	-12(%ebp), %edx
	movl	8(%ebp), %eax
	addl	%edx, %eax
	movzbl	(%eax), %eax
	movb	%al, -13(%ebp)
	cmpb	$10, -13(%ebp)
	jne	L14
	movl	12(%ebp), %eax
	movl	%eax, -4(%ebp)
	addl	$12, -8(%ebp)
	jmp	L15
L14:
	movzbl	28(%ebp), %eax
	movl	%eax, 20(%esp)
	movzbl	24(%ebp), %eax
	movl	%eax, 16(%esp)
	movzbl	20(%ebp), %eax
	movl	%eax, 12(%esp)
	movl	-8(%ebp), %eax
	movl	%eax, 8(%esp)
	movl	-4(%ebp), %eax
	movl	%eax, 4(%esp)
	movsbl	-13(%ebp), %eax
	movl	%eax, (%esp)
	call	_draw_char
	addl	$8, -4(%ebp)
	cmpl	$792, -4(%ebp)
	jle	L15
	movl	12(%ebp), %eax
	movl	%eax, -4(%ebp)
	addl	$12, -8(%ebp)
L15:
	addl	$1, -12(%ebp)
L13:
	movl	-12(%ebp), %edx
	movl	8(%ebp), %eax
	addl	%edx, %eax
	movzbl	(%eax), %eax
	testb	%al, %al
	jne	L16
	nop
	nop
	leave
	.cfi_restore 5
	.cfi_def_cfa 4, 4
	ret
	.cfi_endproc
LFE1:
	.ident	"GCC: (MinGW-W64 x86_64-ucrt-posix-seh, built by Brecht Sanders, r2) 16.1.0"
	.def	_draw_pixel;	.scl	2;	.type	32;	.endef
